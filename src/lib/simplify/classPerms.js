import normalizeClassPerms from "../normalize/classPerms";
import { copyFromTemplate, defaultClassPerm } from "../tools/defaultObjects";
import simplifyPerms from "./perms";

function simplifyClassPerms(classPerms, mainDomain) {
    if (classPerms == null) return null;

    let simplified = [];
    for (let classPerm of normalizeClassPerms(classPerms)) {
        if (classPerm != null) {
            let simplifiedClassPerm = copyFromTemplate(classPerm, defaultClassPerm);                
            simplifiedClassPerm.read = simplifyPerms(simplifiedClassPerm.read, mainDomain);
            simplifiedClassPerm.write = simplifyPerms(simplifiedClassPerm.write, mainDomain);
            simplified.push(simplifiedClassPerm);
        }
    }
    return simplified;
}

export default simplifyClassPerms;