const { PLATFORM, detectOS, executeCommand } = require('./index')

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