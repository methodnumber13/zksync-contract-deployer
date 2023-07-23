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
      const defaultValue = { name: "", arguments: [] };
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
      return totalFee;
    } catch (error) {
      console.error(error)
      return 0;
    }
  }

  export async function getSecrets() {
    try {
      const pathToFile = path.join(__dirname, '../', '.secrets')

      const files = fs.readFileSync(pathToFile, {encoding: 'utf-8'})

      const lines = files.trim().split('\n');
      
      const secrets = lines.filter((line) => line.trim() !== '');
      
      console.log('Secrets array:', secrets);
      return secrets

    } catch (error) {
      console.error(error);
      return []
    }
  }