import normalizePerms from "./perms";
import { defaultAttrPerm } from "./_defaultObjects";

function normalizeAttrPerms(attrPerms) {
    let normalized = [];
    
    if (attrPerms !== undefined) {
        for (let attrPerm of attrPerms) {
            if (attrPerm.key == null) throw "missing key";

            normalized.push(Object.assign({}, defaultAttrPerm, attrPerm, {
                read: normalizePerms(attrPerm.read),
                write: normalizePerms(attrPerm.write),
            }));
        }
    }
    
    return normalized;
}

export default normalizeAttrPerms;