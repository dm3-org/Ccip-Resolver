import { expect } from "chai"
import { ethers } from "ethers"
import { getConfigReader } from "../../gateway/config/ConfigReader"

describe.only("ReadConfig Test", () => {
    it("Reads config for Signiture Resolver", () => {
        const configString = JSON.stringify({
            "0xafb5b5032d920c8158e541c6326ce63baf60aabf": {
                type: "signing",
                handlerUrl: "http://test"
            }
        })

        console.log(ethers.utils.getAddress("0xAFb5B5032d920C8158E541c6326CE63BAF60aAbf"))
        console.log(ethers.utils.getAddress("0xafb5b5032d920c8158e541c6326ce63baf60aabf"))


        console.log(getConfigReader(configString).getConfigForResolver("0xafb5b5032d920c8158e541c6326ce63baf60aabf"))
        expect(getConfigReader(configString).getConfigForResolver("0xafb5b5032d920c8158e541c6326ce63baf60aabf")).to.eql(
            {
                type: "signing",
                handlerUrl: "http://test"
            }
        )

        expect(getConfigReader(configString).getConfigForResolver("0xAFb5B5032d920C8158E541c6326CE63BAF60aAbf")).to.eql(
            {
                type: "signing",
                handlerUrl: "http://test"
            }
        )



    })
})
