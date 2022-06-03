import normalizeAttrPerms from "../normalize/attrPerms";
import { copyFromTemplate, defaultAttrPerm } from "../tools/defaultObjects";

function simplifyAttrPerms(attrPerms) {
    if (attrPerms == null) return null;

    let simplified = [];
    for (let attrPerm of normalizeAttrPerms(attrPerms)) {
        if (attrPerm != null) {
            let simplifiedAttrPerm = copyFromTemplate(attrPerm, defaultAttrPerm);                
            simplified.push(simplifiedAttrPerm);
        }
    }
    return simplified;
}

export default simplifyAttrPerms;