import { expect } from "chai";

import { getConfigReader } from "../../gateway/config/ConfigReader";


describe("ReadConfig Test", () => {
    it("Reads config for Signiture Resolver", () => {
        const configString = JSON.stringify({
            "0xafb5b5032d920c8158e541c6326ce63baf60aabf": {
                type: "signing",
                handlerUrl: "http://test",
            },
            "0x49e0AeC78ec0dF50852E99116E524a43bE91B789": {
                type: "optimism-bedrock",
                handlerUrl: "http://test",
            },
        });
        expect(getConfigReader(configString).getConfigForResolver("0xafb5b5032d920c8158e541c6326ce63baf60aabf")).to.eql({
            type: "signing",
            handlerUrl: "http://test",
        });

        expect(getConfigReader(configString).getConfigForResolver("0xAFb5B5032d920C8158E541c6326CE63BAF60aAbf")).to.eql({
            type: "signing",
            handlerUrl: "http://test",
        });
        expect(getConfigReader(configString).getConfigForResolver("0x49e0AeC78ec0dF50852E99116E524a43bE91B789")).to.eql({
            type: "optimism-bedrock",
            handlerUrl: "http://test",
        });
        expect(getConfigReader(configString).getConfigForResolver("0x49e0aec78ec0df50852e99116e524a43be91b789")).to.eql({
            type: "optimism-bedrock",
            handlerUrl: "http://test",
        });
    });
    it("Throws when config is undefined", () => {
        expect(() => getConfigReader(undefined)).to.throw("CONFIG IS MISSING");
    });
    it("Throws when config is not valid JSON", () => {
        expect(() => getConfigReader("FOOO")).to.throw("Invalid JSON");
    });
    it("Throw if config  entry key is not an address", () => {
        expect(() =>
            getConfigReader(
                JSON.stringify({
                    "0xafb5b5032d920c8158e541c6326ce63baf60aabf": {
                        type: "signing",
                        handlerUrl: "http://test",
                    },
                    FOOO: {
                        type: "signing",
                        handlerUrl: "http://test",
                    },
                })
            )
        ).to.throw("Invalid address FOOO");
    });
});
