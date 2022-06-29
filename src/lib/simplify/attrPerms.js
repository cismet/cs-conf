import normalizeAttrPerms from "../normalize/attrPerms";
import { copyFromTemplate, defaultAttrPerm } from "../tools/defaultObjects";
import simplifyPerms from "./perms";

function simplifyAttrPerms(attrPerms, mainDomain) {
    if (attrPerms == null) return null;

    let simplified = [];
    for (let attrPerm of normalizeAttrPerms(attrPerms)) {
        if (attrPerm != null) {
            let simplifiedAttrPerm = copyFromTemplate(attrPerm, defaultAttrPerm);
            simplifiedAttrPerm.read = simplifyPerms(simplifiedAttrPerm.read, mainDomain);
            simplifiedAttrPerm.write = simplifyPerms(simplifiedAttrPerm.write, mainDomain);
            simplified.push(simplifiedAttrPerm);
        }
    }
    return simplified;
}

export default simplifyAttrPerms;