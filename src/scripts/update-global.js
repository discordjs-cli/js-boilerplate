// Runs delete-global, then deploy-global
const deleteGlobal = require('./delete-global');
const deployGlobal = require('./deploy-global');

async function main() {
    await deleteGlobal();

    await deployGlobal();

    console.log('\nUpdated global commands!');
}

main();