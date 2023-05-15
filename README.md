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
-   **Gateway [Centralized]:**
    Calculates the actual Proofs (to be decentralized)
-   **READ Client [Client]:**
    A Client used to query data from the blockchain i.E ethers.js

### How does it work

The Optimism Resolver can be set as the default Resolver in the ENS Registry. That replaces the ENS public resolver which stores every data on Ethereum Mainnet with a CCIP resolver that, rather than storing the data on mainnet, performs a CCIP lookup to retrieve the data associated with the account from the L2PublicResolver contract deployed on Optimims.
The data can be easily retrieved by a CCIP-compliant client like ethers.js using just a single line of code.
This reduces the fees occurring when setting records drastically and makes it more compelling to use ENS.

### Lookup

The Optimism Resolvers computes an HTTP address that has to be called by the CCIP read client. The address contains the address of the domain owner retrieved from the ENS Registry contract as well as the requested record. This address points to a Gateway server that is capable of accessing the Optimism Network to fetch the requested data.  
To ensure on the Mainnet that the result of the backend is valid and indeed part of the Optimism storage the Gateway also computes a Merkle Proof for every slot needed.
Using the root of that proof the Optimism contract can ensure the data integrity without having access to it.

The lookup sequence looks like

-   **[Client]** Request something from the provider to resolve i.E `ethers.provider.getText("alice.eth")`
-   **[Client]** calls the `resolver(bytes32 node)` method of the ENS Registry contract. The result will be the address of the Optimism Resolver contract given the user has set it as there provider before.
-   **[Client]** calls the `resolve(bytes calldata name, bytes calldata data)` method to retrieve the address of the CCIP Gateway and call it
-   **[Gateway]** fetches the requested data from the L2PublicResolver contract. Then use 'eth_getProof' to compute a merkle proof showing that the retrieved data belongs to the storageRoot of a certain block. Returns that proof to the client
-   **[Client]** uses the `resolveWithProof(bytes calldata response, bytes calldata extraData)`method of the OptimismResolver contract to verify the integrity of the provided proof.
-   **[OptimismResolver]** calls the `getProofValue(BedrockStateProof memory proof)` from the BedrockProofVerifier Contract To ensure the provided proof is valid.
-   **[BedrockProofVerifier]** Get the output root the proof is related to from the l2OutputOracle contract. Checks if it matches the one provided by the proof. This proves that the outputRootProof the proof is based on is committed. After this check passes the contract checks if the account root is part of the state root. Is this the case the contract checks if each slot provided in the proof is part of that account root. The result is the concatenated value of each slot.
-   **[Client]** Returns the value returned by the BedrockVerifier

## Resources

-   **Ethereum Improvement Proposals ERC-3668:** CCIP Read: Secure offchain data retrieval CCIP Read provides a mechanism to allow a contract to fetch external data.
-   **ENSIP-10: Wildcard Resolution:**
    Provides a mechanism to support wildcard resolution of ENS names (formerly EIP-2544). (36 kB)
    https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution
-

## Installation

1. Clone the repository `git clone https://github.com/corpus-io/Optimism-Resolver`
2. Install dependencies using `yarn install`

## Tests

The tests are based on the Optimism local development environment. To run them you've to run this environment on your machine.
Visit https://community.optimism.io/docs/developers/build/dev-node/ for setup instructions.

1. After you've set up the optimism development environment run `make devnet-up` to start it.
2. Wait at least 5 minutes until everything is set up. This is mandatory because the local development environment contains different containers that are started independently from each other.
3. Run `yarn run e2e:setup` to set up the environment required by the tests. This deploys the contracts and creates the initial data we're later going to prove.
4. Wait again for a few minutes. The rollup needs to commit the changes made. If you see the error "Account is not part of the provided state root" or "Provided proof is invalid" The commit is still pending
5. Run the test using `yarn test`
