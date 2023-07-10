export function dnsWireFormat(domain, ttl, type, cls, address) {
    let labels = domain.split(".");
    let output = "";

    for (let label of labels) {
        output += label.length.toString(16).padStart(2, "0");
        for (let char of label) {
            output += char.charCodeAt(0).toString(16);
        }
    }

    output += "00";
    output += type.toString(16).padStart(4, "0");
    output += cls.toString(16).padStart(4, "0");
    output += ttl.toString(16).padStart(8, "0");

    let addrBytes = address.split(".");
    output += addrBytes.length.toString(16).padStart(4, "0");
    for (let byte of addrBytes) {
        output += parseInt(byte).toString(16).padStart(2, "0");
    }

    return output;
}
