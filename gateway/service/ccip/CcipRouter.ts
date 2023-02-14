export class CcipRouter {
    public async handleRequest(signature: string, request: any) {
        switch (signature) {
            case "text(bytes32,string)":
                console.log("Reading text(bytes32,string)");
                return await this.handleText(request);

            default:
                return null;
        }
    }

    private handleText(request: any) {}
}
