/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-deploy";
import "solidity-coverage";
import "hardhat-storage-layout";
import "hardhat-tracer";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const OPTIMISTIC_ETHERSCAN_API_KEY = process.env.OPTIMISTIC_ETHERSCAN_API_KEY;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
const OPTIMISM_RPC_URL = process.env.OPTIMISM_RPC_URL;

if (!MAINNET_RPC_URL) {
    throw new Error("Please set your MAINNET_RPC_URL in a .env file");
}
if (!OPTIMISM_RPC_URL) {
    throw new Error("Please set your OPTIMISM_RPC_URL in a .env file");
}

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        optimism: {
            url: OPTIMISM_RPC_URL,
            accounts: [process.env.OPTIMISM_PRIVATE_KEY],
        },
        localhost: {},
    },
    etherscan: {
        apiKey: OPTIMISTIC_ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer.
        },
        feeCollector: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.17",
            },
        ],
    },
    mocha: {
        timeout: 100000,
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
};
