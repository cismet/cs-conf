import normalizeUsermanagement from "../normalize/usermanagement";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUser } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsermanagement(usermanagement, mainDomain) {
    if (usermanagement == null) return null;

    let simplified = [];
    for (let user of normalizeUsermanagement(usermanagement)) {
        if (user != null) {
            simplified.push(copyFromTemplate(Object.assign({}, user, { 
                groups: simplifyGroups(user.groups, mainDomain),
                configurationAttributes: simplifyConfigurationAttributes(user.configurationAttributes, mainDomain),
            }), defaultUser));
        }
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