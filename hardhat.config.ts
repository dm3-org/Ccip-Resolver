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
import { ethers } from "ethers";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const OPTIMISTIC_ETHERSCAN_API_KEY = process.env.OPTIMISTIC_ETHERSCAN_API_KEY;

const GOERLI_URL = process.env.GOERLI_RPC_URL ?? "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? ethers.Wallet.createRandom().privateKey;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            forking: {
                url: "http://localhost:8545",
            },
        },
        optimismGoerli: {
            url: "https://goerli.optimism.io",
            accounts: [DEPLOYER_PRIVATE_KEY],
        },
        goerli: {
            url: GOERLI_URL,
            accounts: [DEPLOYER_PRIVATE_KEY],
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
                version: "0.8.15",
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
