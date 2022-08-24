// Runs delete-dev, then deploy-dev
const deleteDev = require('./delete-dev');
const deployDev = require('./deploy-dev');

async function main() {
    await deleteDev();

    await deployDev();

    console.log('\nUpdated dev commands!');
}

main();