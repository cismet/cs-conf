import { copyFromTemplate, defaultClassPerm } from "../tools/defaultObjects";

function simplifyClassPerms(classPerms) {
    if (classPerms == null) return null;

    let simplified = [];
    if (classPerms != null) {
        for (let classPerm of classPerms) {
            if (classPerm != null) {
                let simplifiedClassPerm = copyFromTemplate(classPerm, defaultClassPerm);                
                simplified.push(simplifiedClassPerm);
            }
        }
    }
    return simplified;
}

export default simplifyClassPerms;