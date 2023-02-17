# Optimism-Resolver

## A Optimism CCIP resolver for ENS

Storing data on Ethereum Mainnet is expensive hence it is appealing to use other storage solutions that offer more compelling rates. To facilitate this https://eips.ethereum.org/EIPS/eip-3668 introduces CCIP a standard that can be used to securely retrieve external data. While the solution is focussed on ENS, the methodology can be adapted to any other data from Optimism.

Optimism-Resolver is an CCIP Resolver that retrieves data from optimism and validate the integrity of this data in a trustles manner using merkle proofs.

### Components:
* **OptimisimProofVerifier [L1]:** 
Contract on Ethereum Mainnet that can validate wether a sequence of data is stored on a certain optimism contract.
* **OptimismResolver [L1]:** 
Contract on Ethereum Mainnet that implements the https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution Flow
* **PublicL2Resolver [OP]:**
A fork of the ens Public Resolver Contract on Layer2
* **Backend [Centralized]:**
Calculates the actual Proofs (to be decentrlized)

### Flow (based on ENS)

If a ENS user uses the Optimism Resolver as his default Resolver they can store data such as text records on optimism and benefits from the more appealing transaction costs of the OP ecosystem. The data stored on optimism can be simply retrieved by a CCIP compliant client like ethers.js by a single line of code.

The data integrity of the retrived data is ensured using merkle proofs.

The flow looks like
* **[Backend]** Use `eth_getProof` to create a merkle proof for certain slots on a given contract on Optimism
* **[OptimismProofVerifier]** Call `StateCommitmentChain.verifyStateCommitment()` to check if the `stateRoot` actually exists on L2
* **[OptimismProofVerifier]** Get account of resolver from the state root (This state root proofs that the account is part of that certain state)
* **[OptimismProofVerifier]** For each slot it is ensured that the proof of this particular slot is part of the accounts `storageRoot`

## Resources

* **Ethereum Improvement Proposals ERC-3668:** CCIP Read: Secure offchain data retrieval CCIP Read provides a mechanism to allow a contract to fetch external data.

* **ENSIP-10: Wildcard Resolution:** 
Provides a mechanism to support wildcard resolution of ENS names (formerly EIP-2544). (36 kB)
https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution
