import { defaultAttrPerm } from "./_defaultObjects";

function normalizeAttrPerms(attrPerms) {
    let normalized = [];
    
    if (attrPerms !== undefined) {
        for (let attrPerm of attrPerms) {
            if (attrPerm.key == null) throw "missing key";

            normalized.push(Object.assign({}, defaultAttrPerm, attrPerm));
        }
    }
    
    return normalized;
}

export default normalizeAttrPerms;