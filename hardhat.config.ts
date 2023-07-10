/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-storage-layout";
import "hardhat-tracer";
import { ethers } from "ethers";

const OPTIMISTIC_ETHERSCAN_API_KEY = process.env.OPTIMISTIC_ETHERSCAN_API_KEY;

const GOERLI_URL = process.env.L1_PROVIDER_URL ?? "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? ethers.Wallet.createRandom().privateKey;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            /*      forking: {
                     url: "http://localhost:8545",
                 }, */
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
        apiKey: {
            optimismGoerli: OPTIMISTIC_ETHERSCAN_API_KEY
        },
        customChains: [
            {
                network: "optimismGoerli",
                chainId: 420,
                urls: {
                    apiURL: "https://api-goerli-optimism.etherscan.io/api",
                    browserURL: "https://goerli-optimism.etherscan.io"
                }
            }
        ]

    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.19",
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
