import normalizeUsermanagement from "../normalize/usermanagement";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUser } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsermanagement(usermanagement) {
    if (usermanagement == null) return null;

    let simplified = [];
    for (let user of normalizeUsermanagement(usermanagement)) {
        if (user != null) {
            let simplifiedUser = copyFromTemplate(user, defaultUser);
            if (user.configurationAttributes !== undefined && user.configurationAttributes.length > 0) {
                simplifiedUser.configurationAttributes = simplifyConfigurationAttributes(user.configurationAttributes);
            }            
            if (user.groups != null && user.groups.length > 0) {
                simplifiedUser.groups = simplifyGroups(user.groups);
            }
            simplified.push(simplifiedUser);
        }
    }
    return simplified;
}

function simplifyGroups(groups) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            simplified.push(removeLocalDomain(group));
        }
    }

    return simplified;
}

export default simplifyUsermanagement;