import normalizeAttrPerms from "../normalize/attrPerms";
import { copyFromTemplate, defaultAttrPerm } from "../tools/defaultObjects";
import simplifyPerms from "./perms";

function simplifyAttrPerms(attrPerms, mainDomain) {
    if (attrPerms == null) return null;

    let simplified = [];
    for (let attrPerm of normalizeAttrPerms(attrPerms)) {
        if (attrPerm != null) {
            simplified.push(copyFromTemplate(Object.assign({}, attrPerm, { 
                read: simplifyPerms(attrPerm.read, mainDomain), 
                write: simplifyPerms(attrPerm.write, mainDomain) 
            }), defaultAttrPerm));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyAttrPerms;