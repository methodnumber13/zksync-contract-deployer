const { executeCommand } = require('./index')

/**
 * Checks if Node.js and NPM (Node Package Manager) are installed on the system.
 *
 * @async
 * @function
 * @returns {Promise<boolean>} A promise that resolves to `true` if both Node.js and NPM are installed, otherwise resolves to `false`.
 * @throws {Error} If there are issues with executing the commands to check Node.js and NPM versions.
 * @example
 * // Example usage:
 * async function main() {
 *   try {
 *     const nodeAndNpmExists = await isNodeAndNPMExists();
 *     if (nodeAndNpmExists) {
 *       // Node.js and NPM are installed
 *       console.log('Node.js and NPM are installed.');
 *     } else {
 *       // Node.js or NPM is missing
 *       console.error('Node.js or NPM is not installed. You should install Node.js first:', 'https://nodejs.org/en/download');
 *     }
 *   } catch (error) {
 *     console.error('Error:', error.message);
 *   }
 * }
 * main();
 */

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