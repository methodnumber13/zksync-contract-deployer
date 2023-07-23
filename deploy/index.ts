import dotenv from "dotenv";
import { Wallet, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { 
  deployAndVerify,  
  getContractArguments, 
  getFile, 
  getSecrets, 
  getTotalFee, 
  runCleanCompile 
} from "./helpers";
import { executeCommand } from '../scripts'
 
dotenv.config();
  
export default async function (hre: HardhatRuntimeEnvironment) {
 try {
    const secrets = await getSecrets() || [];

    for (const privateKey of secrets) {
      const wallet = new Wallet(privateKey);
      
      const ARTIFACT_FOLDER = 'artifacts-zk';
      const MAX_USD_FEE = process.env.MAX_USD_FEE as string;
      const isNumber = !isNaN(Number(MAX_USD_FEE));
  
      if(!MAX_USD_FEE && !isNumber) {
        throw Error('Set the MAX_USD_FEE in .env file')
      }
  
      const compileOptions = await runCleanCompile();
  
      if(!compileOptions) {
        throw Error('Error during running clean compile')
      }
  
      let { isSuccessfullyCompled } = compileOptions
  
      if(!isSuccessfullyCompled) {
        throw Error('Error during the artifact compilation')
      }
  
      const { name: CONTRACT_NAME } = await getContractArguments();
      
      const { contractJson } = await getFile(ARTIFACT_FOLDER, CONTRACT_NAME);
  
      if(!contractJson) {
        throw Error('There is no contract json')
      }
  
      const deployer = new Deployer(hre, wallet);
      const artifact = await deployer.loadArtifact(CONTRACT_NAME);
      
      let totalEstimatedFee = await getTotalFee({ deployer, artifact });
  
      while(totalEstimatedFee > +MAX_USD_FEE) {
        totalEstimatedFee = await getTotalFee({ deployer, artifact });
      }
  
      await deployAndVerify({ deployer, artifact, hre });
  
      await executeCommand(`npm run rimraf`);
    }
 } catch (error) {
    console.error(error)
 }
}
    