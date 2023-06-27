import { ethers, ethers as hreEthers } from "hardhat";
import { L2PublicResolver, L2PublicResolver__factory } from "typechain";
import { getPublicResolverAddress } from "../../constants";

/**
 * This class provides the storage location for different for the particular fiels of the PublicResolverContract
 */
export class EnsResolverService {
    private readonly l2PublicResolver: L2PublicResolver;

    constructor(l2PublicResolver: L2PublicResolver,) {
        this.l2PublicResolver = l2PublicResolver;
    }
    public static async instance() {
        const l2PublicResolverFactory = (await hreEthers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

        const l2PublicResolver = await l2PublicResolverFactory.attach(getPublicResolverAddress()).connect(global.l2_provider);
        return new EnsResolverService(l2PublicResolver);
    }

    public async getSlotForText(context: string, node: string, recordName: string): Promise<string> {
        //The storage slot within the particular contract
        const TEXTS_SLOT_NAME = 2;

        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForText(TEXTS_SLOT_NAME, version.toNumber(), context, node, recordName);
    }

    public async getSlotForAddr(context: string, node: string, coinType: number): Promise<string> {
        //The storage slot within the particular contract
        const ADDR_SLOT_NAME = 1;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        return EnsResolverService.getStorageSlotForAddr(ADDR_SLOT_NAME, version.toNumber(), context, node, coinType);
    }
    public async getSlotForAbi(context: string, node: string, contentType: number): Promise<string> {
        //The storage slot within the particular contract
        const ABI_SLOT_NAME = 3;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        return EnsResolverService.getStorageSlotForAbi(ABI_SLOT_NAME, version.toNumber(), context, node, contentType);

    }
    public async getSlotForContentHash(context: string, node: string): Promise<string> {
        //The storage slot within the particular contract
        const CONTENTHASH_SLOT_NAME = 4;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        return EnsResolverService.getStorageSlotForContentType(CONTENTHASH_SLOT_NAME, version.toNumber(), context, node);
    }
    public async getSlotForName(context: string, node: string): Promise<string> {
        //The storage slot within the particular contract
        const NAME_SLOT_NAME = 8;
        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForName(NAME_SLOT_NAME, version.toNumber(), context, node);
    }
    public async getSlotForPubkeyX(context: string, node: string,): Promise<string> {
        //The storage slot within the particular contract
        const PUBKEY_SLOT_NAME = 9;

        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForPubkey(PUBKEY_SLOT_NAME, version.toNumber(), context, node)


    }
    public async getSlotForPubkeyY(context: string, node: string,): Promise<string> {
        const slotx = this.getSlotForPubkeyX(context, node);
        return ethers.BigNumber.from(slotx).add(1).toHexString();
    }

    public async getSlotForDnsRecord(context: string, node: string, name: string, resource: string): Promise<string> {
        //The storage slot within the particular contract
        const NAME_SLOT_NAME = 6;
        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForDnsRecord(NAME_SLOT_NAME, version.toNumber(), context, node, name, resource);
    }
    public async getSlotForHasDnsRecords(context: string, node: string, name: string,): Promise<string> {
        //The storage slot within the particular contract
        const NAME_SLOT_NAME = 6;
        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForHasDnsRecords(NAME_SLOT_NAME, version.toNumber(), context, node, name);
    }
    public async getSlotForZoneHash(context: string, node: string, name: string,): Promise<string> {
        //The storage slot within the particular contract
        const NAME_SLOT_NAME = 5;
        const version = await this.l2PublicResolver.recordVersions(context, node);
        return EnsResolverService.getStorageSlotForZonehash(NAME_SLOT_NAME, version.toNumber(), context, node, name);
    }


    public static getStorageSlotForVersion(slot: number, context: string, node: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["bytes", "uint256"], [context, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [node, innerHash]);
        return contextHash;
    }
    public static getStorageSlotForText(slot: number, versionNumber: number, context: string, node: string, recordName: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const middleHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["string", "bytes32"], [recordName, middleHash]);
        return outerHash;
    }
    public static getStorageSlotForAddr(slot: number, versionNumber: number, context: string, node: string, coinType: number) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [coinType, nodeHash]);
        return outerHash;
    }
    public static getStorageSlotForAbi(slot: number, versionNumber: number, context: string, node: string, contentType: number) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [contentType, nodeHash]);
        return outerHash;
    }
    public static getStorageSlotForContentType(slot: number, versionNumber: number, context: string, node: string,) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        return outerHash;
    }

    public static getStorageSlotForName(slot: number, versionNumber: number, context: string, node: string,) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        return outerHash;
    }

    public static getStorageSlotForPubkey(slot: number, versionNumber: number, context: string, node: string,) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        return nodeHash;
    }
    public static getStorageSlotForDnsRecord(slot: number, versionNumber: number, context: string, node: string, name: string, resource: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const nameHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
        const resourceHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [resource, nameHash]);
        return resourceHash;
    }
    public static getStorageSlotForHasDnsRecords(slot: number, versionNumber: number, context: string, node: string, name: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const nameHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
        return nameHash;
    }
    public static getStorageSlotForZonehash(slot: number, versionNumber: number, context: string, node: string, name: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        return nodeHash;
    }

}
