<h1 align="left">zkSync era smart contract deployer</h1>

_**Fully automated deployment**_

## Prerequisites

Make sure you have the following installed on your system:

* Node.js (v14 or higher)
* npm (Node Package Manager)

## Setup

1. Clone this repository to your local machine.
2. Make sure .env file exists in the root directory and has the following environment variables:
   
```
TIMEOUT_MS=10000 #request gas price timeout
MAX_USD_FEE=1 #max comission value(included gas and deploy comission)
```
3. Add your private keys to .secrets file.
4. If you want to deploy any another contract:
   * navigate to contracts folder, remove existed contract and paste your own
   * change variables in deploy/arguments.js dependent on your contract

## Usage

```bash
npm run deploy
```
This script will perform the following steps:

1. Load your Ethereum account using the provided private key.
2. Compile the smart contracts using Hardhat.
3. Calculate the total fee required for deployment based on the contract's size and gas costs.
4. Deploy the contract to zkSync and the Ethereum network.
5. Verify the deployed contract on zkScan using Hardhat.
   
_*Please ensure that your zkSync wallet is funded with enough funds to cover the deployment and verification costs.*_

