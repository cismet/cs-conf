import normalizeUsermanagement from "../normalize/usermanagement";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUser } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

export function simplifyUsermanagement(usermanagement, mainDomain) {
    if (usermanagement == null) return null;

    let simplified = [];
    for (let user of normalizeUsermanagement(usermanagement)) {
        let simplifiedUser = simplifyUser(user, mainDomain);
        if (simplifiedUser != null) {
            simplified.push(simplifiedUser);
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export function simplifyUser(user, mainDomain) {
    let simplified = null;
    if (user != null) {
        let unshadowedGroups = user.groups;
        
        simplified = copyFromTemplate(Object.assign({}, user, { 
            groups: simplifyGroups(unshadowedGroups, mainDomain),
            configurationAttributes: simplifyConfigurationAttributes(user.configurationAttributes, mainDomain),
        }), defaultUser)
    }
    return simplified
}

export function simplifyGroup(group, mainDomain = null) {
    let simplified = null;
    if (group != null) {
        simplified = removeLocalDomain(group, mainDomain);
    }
    return simplified;
}

export function simplifyGroups(groups, mainDomain = null) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            let simplifiedGroup = simplifyGroup(group);
            if (simplifiedGroup != null) {
                simplified.push(simplifiedGroup);
            }
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyUsermanagement;