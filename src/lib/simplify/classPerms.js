import normalizeClassPerms from "../normalize/classPerms";
import { copyFromTemplate, defaultClassPerm } from "../tools/defaultObjects";

function simplifyClassPerms(classPerms) {
    if (classPerms == null) return null;

    let simplified = [];
    for (let classPerm of normalizeClassPerms(classPerms)) {
        if (classPerm != null) {
            let simplifiedClassPerm = copyFromTemplate(classPerm, defaultClassPerm);                
            simplified.push(simplifiedClassPerm);
        }
    }
    return simplified;
}

export default simplifyClassPerms;