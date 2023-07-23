const os = require('os');
const { exec } = require('child_process');


const PLATFORM = {
    win32: "WINDOWS",
    darwin: "macOS",
    "Unix": "Unix"
}

function detectOS() {
  const platform = os.platform();
  return PLATFORM[platform] ?? PLATFORM.Unix
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
}

module.exports = {
  executeCommand,
  detectOS,
  PLATFORM
}