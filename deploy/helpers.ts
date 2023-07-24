import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SUCCESS_MESSAGE } from './constants';
import { executeCommand } from '../scripts'
  
  type FileType = { item: string, itemPath: string}

  /**
 * Represents a file or directory item.
 * @typedef {Object} FileType
 * @property {string} item - The name of the item (file or directory).
 * @property {string} itemPath - The full path to the item.
 */

/**
 * Reads a directory and returns an array of FileType objects representing files inside it.
 * @param {string} dirPath - The path to the directory to read.
 * @returns {Promise<FileType[]>} A promise that resolves with an array of FileType objects.
 */
  
  export async function readDirectory(dirPath: string): Promise<FileType[]> {
    const items = await fs.promises.readdir(dirPath);
  
    const files: FileType[] = [];
    const directories: string[] = [];
  
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemStats = await fs.promises.lstat(itemPath);
  
      if (itemStats.isDirectory()) {
        directories.push(itemPath);
      } else if (itemStats.isFile() && itemPath.includes('contracts')) {
        files.push({ item, itemPath });
      }
    }
  
    for (const directory of directories) {
      const nestedFiles = await readDirectory(directory);
      files.push(...nestedFiles);
    }
  
    return files;
  }
  
  type GetFileType = {pathToFile: string, contractJson: ZkSyncArtifact | null}

  /**
 * Represents the result of getting a contract file.
 * @typedef {Object} GetFileType
 * @property {string} pathToFile - The full path to the contract file.
 * @property {ZkSyncArtifact | null} contractJson - The parsed contract JSON or null if parsing failed.
 */

/**
 * Gets a specific contract file from the output directory.
 * @param {string} outputPath - The path to the output directory.
 * @param {string} contractName - The name of the contract file to retrieve.
 * @returns {Promise<GetFileType>} A promise that resolves with the GetFileType object.
 * @throws {Error} If the contract file doesn't exist or there are other errors.
 */
  
  export async function getFile(outputPath: string, contractName: string): Promise<GetFileType> {
    try {
      const outputFolderPath = path.join(outputPath);
  
      if (!fs.existsSync(outputFolderPath)) { 
       throw new Error ('There are no folders')
      }
  
      const files = await readDirectory(outputFolderPath);
  
      if(!files.length) {
        throw Error(`There are no files`)
      }
      const contractItem = files.find(({item}) => item === `${contractName}.json`);
  
      if(!contractItem) {
        throw Error(`Current contract name doesn't exist`)
      }
  
      const pathToFile =  path.join(__dirname, '../', contractItem.itemPath)
      const currentFIle = fs.readFileSync(pathToFile).toString();
  
      const contractJson = currentFIle ? JSON.parse(currentFIle) as ZkSyncArtifact : null;
  
      return { pathToFile, contractJson }
    } catch (error) {
      throw new Error(`Failed to get file: ${error}`);
    }
  }

  /**
 * Compiles a contract using the provided command and returns the compiled data.
 * @param {string} command - The shell command to compile the contract.
 * @param {string} outputPath - The path to the output directory.
 * @returns {Promise<{data: string, name: string}>} A promise that resolves with an object containing the compiled data and the contract file name.
 * @throws {Error} If there are issues with compiling or finding the contract.
 */
  
  export async function compileContract(command: string, outputPath: string) {
    try {
      await executeCommand(command);
  
      const outputFolderPath = path.join(__dirname, outputPath);
  
      if (!fs.existsSync(outputFolderPath)) { 
       throw new Error ('There is no folders')
      }
      const files = fs.readdirSync(outputFolderPath);
      if (files.length) {
        const [file] = files;
  
        const filePath = path.join(outputFolderPath, file)
        const result = fs.readFileSync(filePath).toString();
        return { data: result, name: file };
      } else {
        throw new Error ('There is no files')
      }
    
    } catch (error) {
      throw new Error(`Failed to compile contract: ${error}`);
    }
  }

  /**
 * Runs the clean and compile commands to prepare for contract deployment.
 * @returns {Promise<{ compileContractExucutedMessage: string, isSuccessfullyCompled: boolean }>} Object containing compile execution message and a boolean indicating if compilation was successful.
 */

  export async function runCleanCompile() {
    try {
      await executeCommand(`npm run rimraf`);
      const compileContractExucutedMessage = (await executeCommand(`npm run compile`))?.toString();
      const isSuccessfullyCompled = compileContractExucutedMessage.includes(SUCCESS_MESSAGE);
      return { compileContractExucutedMessage, isSuccessfullyCompled };
    } catch (error) {
      console.error(error)
      return null;
    }
  }

  /**
     * Get the contract arguments.
     *
     * @function
     * @returns {Promise<ContractArguments>} - A promise that resolves with the contract arguments.
     */
  export async function getContractArguments() {
    const defaultValue = { name: "", arguments: [] };
    try {
      const args = (await import('./arguments.json')).default || defaultValue;
      return args
    } catch (error) {
      console.error(error);
      return defaultValue
    }
  }

type BaseDeployerType = {
  deployer: Deployer,
  artifact: ZkSyncArtifact, 
}

type DeployerType = BaseDeployerType & {
  hre: HardhatRuntimeEnvironment, 
}

/**
   * Deploy and verify the contract on zkSync using Hardhat.
   *
   * @function
   * @param {object} deployer - The deployer instance.
   * @param {object} artifact - The contract artifact.
   * @param {import("hardhat/types").HardhatRuntimeEnvironment} hre - The Hardhat Runtime Environment.
   * @param {number} totalFee - The total fee amount in USD.
   * @returns {Promise<void>} - A promise that resolves when the deployment and verification is complete.
   * @throws {Error} If the deployment or verification encounters an error.
*/

export async function deployAndVerify({ deployer, artifact, hre }: DeployerType) {
  try {
    const { name: CONTRACT_NAME, arguments: CONTRACT_ARGUMENTS } = await getContractArguments();
    const deployedContract = await deployer.deploy(artifact, CONTRACT_ARGUMENTS);

    const contractAddress = deployedContract.address;
    const contractName = artifact.contractName
    const contractFullyQualifedName = `contracts/${CONTRACT_NAME}.sol:${CONTRACT_NAME}`

    console.log(`${contractName} was deployed to ${contractAddress}`);

    const verificationObject = {
      address: contractAddress,
      contract: contractFullyQualifedName,
      constructorArguments: CONTRACT_ARGUMENTS
    }
    // !not shown id, only in terminal
    const verificationId = await hre.run("verify:verify", verificationObject);

    console.log(`verificationId: ${verificationId}`)
  } catch (error) {
    console.error(error)
  }
}

  type TotalFeeType = BaseDeployerType;

  /**
     * Calculate the total fee required for contract deployment.
     *
     * @function
     * @param {object} deployer - The deployer instance.
     * @param {object} artifact - The contract artifact.
     * @returns {Promise<number>} - A promise that resolves with the total fee amount in USD.
     */

  export async function getTotalFee({ deployer, artifact }: TotalFeeType) {
    try {
      const { arguments: CONTRACT_ARGUMENTS } = await getContractArguments();

      const deploymentFeeEstimation = await deployer.estimateDeployFee(artifact, CONTRACT_ARGUMENTS);
      const deploymentFee = ethers.utils.formatEther(deploymentFeeEstimation.toString());
      console.log(`deploymentFee: ${deploymentFee} ETH`);

      const gasFeeEstimation = await deployer.estimateDeployGas(artifact, CONTRACT_ARGUMENTS);
      const gasFee = ethers.utils.formatEther(gasFeeEstimation.toString());
      console.log(`gasFee: ${gasFee} ETH`);

      const totalFee = +deploymentFee + +gasFee;
      console.log(`total fee: ${totalFee} ETH`);

      const ethPrice = await getCurrentETHPrice();
      const totalFeeUSD = ethPrice * totalFee;
      console.log(`total fee: ${totalFeeUSD} USD`);

      return totalFeeUSD;
    } catch (error) {
      console.error(error)
      return 0;
    }
  }

    /**
   * Reads the secrets from the .secrets file and returns them as an array.
   *
   * @async
   * @returns {Promise<string[]>} An array containing the secrets read from the file.
   * @throws {Error} If there are issues reading the .secrets file.
   */

  export async function getSecrets(): Promise<string[]> {
    try {
      const pathToFile = path.join(__dirname, '../', '.secrets')
      const files = fs.readFileSync(pathToFile, { encoding: 'utf-8' })
      const lines = files.trim().split('\n');
      const secrets = lines.filter((line) => line.trim() !== '');
      
      return secrets
    } catch (error) {
      console.error(error);
      return []
    }
  }

    /**
   * Fetches the current price of Ethereum (ETH) in USD from the CoinGecko API.
   *
   * @async
   * @param {string} currency - The currency to fetch the price for (default is 'ethereum').
   * @param {string} toSearch - The target currency to convert to (default is 'usd').
   * @returns {Promise<number>} The current price of Ethereum in USD.
   * @throws {Error} If there are issues with the API request or parsing the response.
   */

  export async function getCurrentETHPrice(currency = 'ethereum', toSearch = 'usd'): Promise<number> {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=${toSearch}`;
      const headers = { 'accept': 'application/json' };
      const response = await fetch(url, { headers, method: 'GET' });
      if(!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data?.ethereum?.usd || 0;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  /**
 * A utility function that introduces a delay of the specified duration.
 *
 * @async
 * @param {number} ms - The duration in milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified duration.
 */

  async function wait(ms: number) { 
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
 * Waits for the fee estimation to be within the acceptable range specified by `MAX_USD_FEE`.
 * It uses the `waitForFee` function to repeatedly check the fee with a delay of `TIMEOUT_MS` milliseconds.
 *
 * @async
 * @param {Deployer} deployer - The deployer instance.
 * @param {ZkSyncArtifact} artifact - The contract artifact.
 * @returns {Promise<number>} The total fee amount in USD once it is within the acceptable range.
 * @throws {Error} If there are issues with the fee estimation or if the timeout is exceeded.
 */

  export async function waitForFee(deployer: Deployer, artifact: ZkSyncArtifact) {
    try {
      const MAX_USD_FEE = process.env.MAX_USD_FEE as string;
      const TIMEOUT_MS = process.env.TIMEOUT_MS as string;
      
      while (true) {
        const totalEstimatedFee = await getTotalFee({ deployer, artifact });
    
        if (totalEstimatedFee <= +MAX_USD_FEE) {
          return totalEstimatedFee;
        }
        console.log(`Sleep for ${TIMEOUT_MS} seconds`)
        await wait(+TIMEOUT_MS);
      }
    } catch (error) {
      console.error(error)
      return 0
    }
  }