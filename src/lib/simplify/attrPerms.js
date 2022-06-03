import { copyFromTemplate, defaultAttrPerm } from "../tools/defaultObjects";

function simplifyAttrPerms(attrPerms) {
    if (attrPerms == null) return null;

    let simplified = [];
    if (attrPerms != null) {
        for (let attrPerm of attrPerms) {
            if (attrPerm != null) {
                let simplifiedAttrPerm = copyFromTemplate(attrPerm, defaultAttrPerm);                
                simplified.push(simplifiedAttrPerm);
            }
        }
    }
    return simplified;
}

export default simplifyAttrPerms;