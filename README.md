****# Optimism-Resolver

## An Optimism CCIP resolver for ENS

Storing data on Ethereum Mainnet is expensive hence it is appealing to use other storage solutions that offer more compelling rates. To facilitate this https://eips.ethereum.org/EIPS/eip-3668 introduces CCIP a standard that can be used to securely retrieve external data. While the solution is focused on ENS, the methodology can be adapted to any other data from Optimism.
Optimism-Resolver is a CCIP Resolver that retrieves data from optimism and validates the integrity of this data in a trustless manner using merkle proofs.

### Components:
* **BedrockProofVerifier [L1]:** 
Contract on Ethereum Mainnet that can validate whether a sequence of data is stored on a certain optimism contract.
* **OptimismResolver [L1]:** 
Contract on Ethereum Mainnet that implements the https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution Flow
* **PublicL2Resolver [OP]:**
A fork of the ens Public Resolver Contract on Layer2
* **Backend [Centralized]:**
Calculates the actual Proofs (to be decentralized)

### Flow (based on ENS)
If an ENS user uses the Optimism Resolver as his default Resolver they can store data such as text records on optimism and benefits from the more appealing transaction costs of the OP ecosystem. The data stored on optimism can be simply retrieved by a CCIP-compliant client like ethers.js by a single line of code.

The data integrity of the retrieved data is ensured using merkle proofs.

The flow looks like
* **[Backend]** Use `eth_getProof` to create a merkle proof for certain slots on a given contract on Optimism
* **[BedrockProofVerifier]** Call `StateCommitmentChain.verifyStateCommitment()` to check if the `stateRoot` exists on L2
* **[BedrockProofVerifier]** Get the account of the L2PublicResolver from the state root (This state root proofs that the account is part of that certain state)
* **[BedrockProofVerifier]** For each slot it is ensured that the proof of this particular slot is part of the account's `storageRoot`

## Resources

* **Ethereum Improvement Proposals ERC-3668:** CCIP Read: Secure offchain data retrieval CCIP Read provides a mechanism to allow a contract to fetch external data.

* **ENSIP-10: Wildcard Resolution:** 
Provides a mechanism to support wildcard resolution of ENS names (formerly EIP-2544). (36 kB)
https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution

## Installation 
1. First clone the repo
2. Run ```yarn install``` to install all dependencies
3. Create a .env file based on env.example
Add an Optimism and a Mainnet RPC provider url to the .env file

## Tests 
Run ```yarn test ``` to execute the test suite.

To ensure the OptimismResolver works correctly we're forking the mainnet and making a proof for a contract that is deployed on optimism mainnet. 

The contract we're creating a proof for is the L2PublicResolver contract deployed at https://optimistic.etherscan.io/address/0xb20eb9648b4a818aa621053f1aa1103c03f2df57#readContract

The proof we're creating is proofing that the node 
``` 0x803156452A647027795BB1EE20480E90E449D61304DF9E9DBAE4047DA37893BA```

has a text record ```network.dm3.eth``` with the value
```json 
{
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
}
``` 

