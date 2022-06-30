import normalizeUsermanagement from "../normalize/usermanagement";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUser } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsermanagement(usermanagement, mainDomain = null) {
    if (usermanagement == null) return null;

    let simplified = [];
    for (let user of normalizeUsermanagement(usermanagement)) {
        if (user != null) {
            let simplifiedUser = copyFromTemplate(user, defaultUser);
            if (user.configurationAttributes !== undefined && user.configurationAttributes.length > 0) {
                simplifiedUser.configurationAttributes = simplifyConfigurationAttributes(user.configurationAttributes, mainDomain);
            }            
            if (user.groups != null && user.groups.length > 0) {
                simplifiedUser.groups = simplifyGroups(user.groups, mainDomain);
            }
    return simplified.length > 0 ? simplified : undefined;
}

function simplifyGroups(groups, mainDomain = null) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            simplified.push(removeLocalDomain(group, mainDomain));
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyUsermanagement;