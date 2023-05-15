\*\*\*\*# Optimism-Resolver

## An Optimism CCIP resolver for ENS

Storing data on Ethereum Mainnet is expensive hence it is appealing to use other storage solutions that offer more compelling rates. To facilitate this https://eips.ethereum.org/EIPS/eip-3668 introduces CCIP a standard that can be used to securely retrieve external data. While the solution is focused on ENS, the methodology can be adapted to any other data from Optimism.
Optimism-Resolver is a CCIP Resolver that retrieves data from optimism and validates the integrity of this data in a trustless manner using merkle proofs.

### Components:

-   **BedrockProofVerifier [L1]:**
    Contract on Ethereum Mainnet that can validate whether a sequence of data is stored on a certain optimism contract.
-   **OptimismResolver [L1]:**
    Contract on Ethereum Mainnet that implements the https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution Flow
-   **PublicL2Resolver [OP]:**
    A fork of the ens Public Resolver Contract on Layer2
-   **Backend [Centralized]:**
    Calculates the actual Proofs (to be decentralized)

### Flow (based on ENS)

-   TODO update flow to bedrock

If an ENS user uses the Optimism Resolver as his default Resolver they can store data such as text records on optimism and benefits from the more appealing transaction costs of the OP ecosystem. The data stored on optimism can be simply retrieved by a CCIP-compliant client like ethers.js by a single line of code.

The data integrity of the retrieved data is ensured using merkle proofs.

The flow looks like

-   **[Backend]** Use `eth_getProof` to create a merkle proof for certain slots on a given contract on Optimism
-   **[BedrockProofVerifier]** Call `StateCommitmentChain.verifyStateCommitment()` to check if the `stateRoot` exists on L2
-   **[BedrockProofVerifier]** Get the account of the L2PublicResolver from the state root (This state root proofs that the account is part of that certain state)
-   **[BedrockProofVerifier]** For each slot it is ensured that the proof of this particular slot is part of the account's `storageRoot`

## Resources

-   **Ethereum Improvement Proposals ERC-3668:** CCIP Read: Secure offchain data retrieval CCIP Read provides a mechanism to allow a contract to fetch external data.

-   **ENSIP-10: Wildcard Resolution:**
    Provides a mechanism to support wildcard resolution of ENS names (formerly EIP-2544). (36 kB)
    https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution

## Installation

1. Clone the repository ```git clone https://github.com/corpus-io/Optimism-Resolver```
2. Install dependencies using ```yarn install```


## Tests

The tests are based on the Optimism local development environment. To run them you've to run this environment on your machine.
Visit https://community.optimism.io/docs/developers/build/dev-node/ for setup instructions.

1. After you've set up the optimism development environment run ```make devnet-up``` to start it.
2. Wait at least 5 minutes until everything is set up. This is mandatory because the local development environment contains differrent containers that are started independently from each other. 
3. Run ```yarn run e2e:setup``` to set up the environment required by the tests. This deploys the contracts and creates the initial data we're later going to prove. 
4. Wait again for a few minutes. The rollup needs to commit the changes made. If you see the error "Account is not part of the provided state root" or "Provided proof is invalid" The commit is still pending
5. Run the test using ```yarn test```
