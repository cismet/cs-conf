import { copyFromTemplate, defaultUserGroup } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsergroups(usergroups) {
    if (usergroups == null) return null;

    let simplified = [];
    if (usergroups != null) {
        for (let group of usergroups) {
            if (group != null) {
                let simplifiedGroup = copyFromTemplate(group, defaultUserGroup);
                if (group.configurationAttributes !== undefined) {
                    simplifiedGroup.configurationAttributes = simplifyConfigurationAttributes(group.configurationAttributes);
                }
                simplified.push(simplifiedGroup);
            }
        }
    }        
    return simplified;
}

export default simplifyUsergroups;