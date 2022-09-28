const { GatewayIntentBits, Client, Collection, ActivityType, Partials } = require('discord.js');

const { TOKEN, PREFIX, LOG_CHANNEL, BOT_NAME, ACTIVITY, TYPE, STATUS } = require('./config/config.js');

const logready = require('logready');
const logError = require('./modules/error.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.User, Partials.Channel, Partials.Message, Partials.GuildMember],
});

const fs = require('node:fs');
const path = require('node:path');

client.slashCommands = new Collection();
const slashCommandDir = fs.readdirSync(__dirname + '/interactions/slash_commands/');
for (const slashCommandPath of slashCommandDir) {
    const commandFiles = fs
        .readdirSync(__dirname + '/interactions/slash_commands/' + slashCommandPath)
        .filter((x) => x.endsWith('.command.js'));

    for (var commandFile of commandFiles) {
        const command = require(path.join(
            __dirname,
            '/interactions/slash_commands/' + slashCommandPath + '/' + `${commandFile}`
        ));
        client.slashCommands.set(command.data.name, command);
    }
};

client.buttonHandler = new Collection();
const buttonDirs = fs.readdirSync(__dirname + '/interactions/buttons');
for (const buttonPath of buttonDirs) {
    const buttonFiles = fs
        .readdirSync(__dirname + '/interactions/buttons/' + buttonPath)
        .filter((x) => x.endsWith('.button.js'));

    for (var buttonFile of buttonFiles) {
        const button = require(path.join(__dirname, 'interactions/buttons/' + buttonPath + '/' + `${buttonFile}`));
        client.buttonHandler.set(button.button_id, button);
    }
};

client.menuHandler = new Collection();
const menuDirs = fs.readdirSync(__dirname + '/interactions/menus');
for (const menuPath of menuDirs) {
    const menuFiles =
        fs.readdirSync(__dirname + '/interactions/menus/' + menuPath)
            .filter((x) => x.endsWith('.menu.js'));

    for (var menuFile of menuFiles) {
        const menu = require(path.join(__dirname, 'interactions/menus/' + menuPath + '/' + `${menuFile}`));
        client.menuHandler.set(`${menu.menu_id}%%${menu.menu_value}`, menu);
    }
};

// Modal Handler
// client.modalHandler = new Collection();
// const modalFiles =
//     fs.readdirSync(path.join(__dirname, "interactions/modals"))
//         .filter((file) => file.endsWith(".modal.js"));
// for (const file of modalFiles) {
//     const modal = require(path.join(__dirname, "interactions/modals", `${file}`));
//     client.modalHandler.set(modal.id, modal);
// };

client.legacyCommands = new Collection();
const commandDirs = fs.readdirSync(path.join(__dirname, 'interactions/legacy_commands'));
for (const legacyPath of commandDirs) {
    const legacyFiles = fs
        .readdirSync(__dirname + '/interactions/legacy_commands/' + legacyPath)
        .filter((x) => x.endsWith('.command.js'));

    for (var legacyFile of legacyFiles) {
        const command = require(path.join(__dirname, '/interactions/legacy_commands/' + legacyPath + '/' + `${legacyFile}`));
        client.legacyCommands.set(command.name, command);
    }
};

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.slashCommands.get(interaction.commandName);

        if (command) {
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'There was an error while executing this command :/',
                    ephemeral: true,
                });

                logError(client, error, LOG_CHANNEL, 'Slash');
            }
        }
    }

    if (interaction.isButton()) {
        const button = client.buttonHandler.get(interaction.customId);

        if (button) {
            try {
                button.execute(interaction, client);
            } catch (error) {
                console.log(error);

                logError(client, error, LOG_CHANNEL, 'Buttons');
            }
        }
    }

    if (interaction.isSelectMenu()) {
        const menu = client.menuHandler.get(interaction.customId + '%%' + interaction.values[0]);

        if (menu) {
            try {
                menu.execute(interaction, client);
            } catch (error) {
                console.log(error);

                logError(client, error, LOG_CHANNEL, 'Menus');
            }
        }
    }
});

client.on('messageCreate', (message) => {
    if (message.author.bot || !message.guild) return;

    if (!message.content.startsWith(PREFIX)) return;

    var args = message.content.slice(PREFIX.length).split(' ');
    const commandName = args.shift().toLowerCase();

    const command =
        client.legacyCommands.get(commandName) ||
        client.legacyCommands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.log(error);

        logError(client, error, LOG_CHANNEL, 'Legacy');
    }
});

client.on('ready', async () => {
    logready(BOT_NAME);

    client.user.setPresence({
        activities: [
            {
                name: `${ACTIVITY}`,
                type: ActivityType[TYPE],
            },
        ],
        status: `${STATUS}`,
    });
});

client.login(TOKEN);
