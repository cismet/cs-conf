import normalizeConfigurationAttributes from "../normalize/configurationAttributes";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultConfigurationAttributes } from "../tools/defaultObjects";

function simplifyConfigurationAttributes(configurationAttributes, mainDomain = null) {
    if (configurationAttributes == null) return null;

    let simplified = [];
    for (let configurationAttribute of normalizeConfigurationAttributes(configurationAttributes)) {
        if (configurationAttribute != null) {
            simplified.push(copyFromTemplate(Object.assign({}, configurationAttribute, { 
                groups: simplifyGroups(configurationAttribute.groups, mainDomain) 
            }), defaultConfigurationAttributes));
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

export default simplifyConfigurationAttributes;