import normalizeClassPerms from "../normalize/classPerms";
import { copyFromTemplate, defaultClassPerm } from "../tools/defaultObjects";
import simplifyPerms from "./perms";

function simplifyClassPerms(classPerms, mainDomain) {
    if (classPerms == null) return null;

    let simplified = [];
    for (let classPerm of normalizeClassPerms(classPerms)) {
        if (classPerm != null) {
            simplified.push(copyFromTemplate(Object.assign({}, classPerm, { 
                read: simplifyPerms(classPerm.read, mainDomain), 
                write: simplifyPerms(classPerm.write, mainDomain) 
            }), defaultClassPerm));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyClassPerms;