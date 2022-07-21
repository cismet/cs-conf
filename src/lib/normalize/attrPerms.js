import normalizePerms from "./perms";
import { defaultAttrPerm } from "../tools/defaultObjects";

function normalizeAttrPerms(attrPerms) {
    let normalized = [];
    
    if (attrPerms !== undefined) {
        for (let attrPerm of attrPerms) {
            if (attrPerm.key == null) throw "normalizeAttrPerms: missing key";

            normalized.push(Object.assign({}, defaultAttrPerm, attrPerm, {
                key: attrPerm.key.toLowerCase(),
                read: normalizePerms(attrPerm.read),
                write: normalizePerms(attrPerm.write),
            }));
        }
    }
    
    return normalized;
}

export default normalizeAttrPerms;