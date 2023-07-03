# ENS-Bedrock-Resolver

This is an App specific handler to store ENS records on Optimism. It uses a forked version of the ENS Public Resolver and a server acting as a gateway.

# Setup L1

To store records on L2 you've to set the CcipResolver as the default resolver and set the BedrockCcipVerifier as the resolver for your domain.

## Change Resolver

1. Go to scripts/setCcipResolver.ts and replace ENS_NAME with the node you want to change the resolver for.
2. Run npx hardhat run ./scripts/setCcipResolver.ts --network goerli

## Set Verifier for domain

1. Go to scripts/setResolverForDomain.ts and replace ENS_NAME with the node you want to change the resolver for.

# Setup Gateway

To run a gateway perform the following steps

1. Deploy and L2PublicResolver or use an instance already deployed
2. Create a .env file and copy the content of env.example. If you want to use an instance already deployed you can omit DEPLOYER_PRIVATE_KEY and OPTIMISTIC_ETHERSCAN_API_KEY
3. Run `yarn start`

# Deployments

## Optimsim **Goerli**

L2PublicResolver: 0x39Dc8A3A607970FA9F417D284E958D4cA69296C8
