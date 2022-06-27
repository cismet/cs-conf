import normalizeUsergroups from "../normalize/usergroups";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultUserGroup } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsergroups(usergroups, mainDomain = true) {
    if (usergroups == null) return null;

    let simplified = [];
    for (let group of normalizeUsergroups(usergroups)) {
        if (group != null && group.key != null) {
            group.key = removeLocalDomain(group.key, mainDomain);
            let simplifiedGroup = copyFromTemplate(group, defaultUserGroup);
            if (group.configurationAttributes !== undefined && group.configurationAttributes.length > 0) {
                simplifiedGroup.configurationAttributes = simplifyConfigurationAttributes(group.configurationAttributes);
            }
            simplified.push(simplifiedGroup);
        }
    }
    return simplified;
}

export default simplifyUsergroups;