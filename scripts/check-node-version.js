const { executeCommand } = require('./index')

async function isNodeAndNPMExists() {
    try {
      const downloadLink = 'https://nodejs.org/en/download'
      const nodeVersion = await executeCommand('node -v') || "";
      const npmVersion = await executeCommand('npm -v') || "";
      console.log(`Node.js Version: ${nodeVersion}`);
      console.log(`NPM Version: ${npmVersion}`);

      return nodeVersion && npmVersion
    } catch (error) {
      console.error('You should install nodejs first', downloadLink);
      return false;
    }
}

isNodeAndNPMExists()