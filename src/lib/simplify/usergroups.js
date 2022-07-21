import normalizeUsergroups from "../normalize/usergroups";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUserGroup } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsergroups(usergroups, mainDomain) {
    if (usergroups == null) return null;

    let simplified = [];
    for (let group of normalizeUsergroups(usergroups)) {
        if (group != null && group.key != null) {
            simplified.push(copyFromTemplate(Object.assign({}, group, { 
                key: removeLocalDomain(group.key, mainDomain),
                configurationAttributes: simplifyConfigurationAttributes(group.configurationAttributes, mainDomain),
            }), defaultUserGroup));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyUsergroups;