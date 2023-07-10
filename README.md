# ENS-Bedrock-Resolver

This is an App specific handler to store ENS records on Optimism. It uses a forked version of the ENS Public Resolver and a server acting as a gateway.

# Setup

## Install

1. Clone the repo `git clone git@github.com:corpus-io/ENS-Bedrock-Resolver.git`
2. run `yarn install`
3. Create an Env file using `cp env.example .env`

## Prepare environment

To deploy a new contract or run a script that sets a verifier on L1 (Layer 1), you'll need to provide a `DEPLOYER_PRIVATE_KEY` to sign your transactions.

If you want to use Hardhat validation, you can also provide an `OPTIMISTIC_ETHERSCAN_API_KEY`. This API key enables Hardhat to validate transactions using Etherscan.

To run the gateway, you'll need to provide the following information:
- `L2_RESOLVER_ADDRESS`: This address represents the Resolver used by the gateway to resolve requested records.
- `L1_PROVIDER_URL`: The RPC provider address for L1 (Layer 1).
- `L2_PROVIDER_URL`: The RPC provider address for L2 (Layer 2).

Make sure you have the necessary `DEPLOYER_PRIVATE_KEY`, `OPTIMISTIC_ETHERSCAN_API_KEY`, `L2_RESOLVER_ADDRESS`, `L1_PROVIDER_URL`, and `L2_PROVIDER_URL` when deploying a contract, running a script, or running the gateway.


# Setup Resolver
**To use the ENS-Bedrock-Resolver for your ENS name, you need to complete 2 transactions on the mainnet to set it up.**

1. Set the CCIP-Resolver contract as your resolver:
   - You can either use the ENS Frontend or the script `setCcipResolver.ts`.
   - When using the script, replace the `ENS_NAME` constant with your ENS name and run the following command:
     ```
     npx hardhat run ./scripts/setCcipResolver.ts --network goerli
     ```

2. Set the BedrockCcipVerifier and the gateway URL for your ENS name:
   - Currently, there is no frontend available to do this directly.
   - You can use the script `setVerifierForDomain.ts` to perform the transaction.
   - Adjust the script by specifying your ENS name and URL, and then run the following command:
     ```
     npx hardhat run ./scripts/setVerifierForDomain.ts --network goerli
     ```

Please make sure to replace `ENS_NAME` with your actual ENS name and adjust the URL accordingly. When running the scripts, specify the correct network (`goerli` in this example).

By following these steps, you'll successfully set up the ENS-Bedrock-Resolver for your ENS name.



# Setup Gateway

To run a gateway perform the following steps

1. Deploy and L2PublicResolver or use an instance already deployed
2. Create a .env file and copy the content of env.example. If you want to use an instance already deployed you can omit DEPLOYER_PRIVATE_KEY and OPTIMISTIC_ETHERSCAN_API_KEY
3. Run `yarn start`

# Deployments

## Goerli

CCIP Resolver : 0x410EBbabB4471e9c18CC36642F4057812E125e94
BedrockCcipVerifier : 0x6eFc563E6c269B137F1362580Cc04F054204a352
## Optimsim Goerli

L2PublicResolver: 0x39Dc8A3A607970FA9F417D284E958D4cA69296C8
