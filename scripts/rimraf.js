const { PLATFORM, detectOS, executeCommand } = require('./index')

/**
 * Removes specified folders based on the detected operating system.
 *
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves after removing the folders successfully.
 * @throws {Error} If there are issues executing the commands or if the folders cannot be removed.
 * @example
 * // Example usage:
 * async function main() {
 *   try {
 *     await rimraf();
 *     console.log('Folders removed successfully.');
 *   } catch (error) {
 *     console.error('Error removing folders:', error.message);
 *   }
 * }
 * main();
 */

async function rimraf() {
    const FOLDERS_TO_REMOVE = 'out artifacts-zk cache-zk'
    try {
        const platform = detectOS();

        if(platform === PLATFORM.win32) {
            await executeCommand(`rmdir /s /q ${FOLDERS_TO_REMOVE}`)
        } else {
            await executeCommand(`rm -rf ${FOLDERS_TO_REMOVE}`)
        }
        console.log('Folders removed successfully.');
    } catch (error) {
        console.error(`Can't remove folders: ${FOLDERS_TO_REMOVE}`);
        console.error('Error:', error);
    }
}

rimraf()