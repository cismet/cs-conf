import normalizeUsergroups from "../normalize/usergroups";
import { copyFromTemplate, defaultUserGroup } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsergroups(usergroups) {
    if (usergroups == null) return null;

    let simplified = [];
    for (let group of normalizeUsergroups(usergroups)) {
        if (group != null) {
            let simplifiedGroup = copyFromTemplate(group, defaultUserGroup);
            if (group.configurationAttributes !== undefined) {
                simplifiedGroup.configurationAttributes = simplifyConfigurationAttributes(group.configurationAttributes);
            }
            simplified.push(simplifiedGroup);
        }
    }
    return simplified;
}

export default simplifyUsergroups;