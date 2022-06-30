import normalizeConfigurationAttributes from "../normalize/configurationAttributes";
import { removeLocalDomain } from "../tools/cids";
import { copyFromTemplate, defaultConfigurationAttributes } from "../tools/defaultObjects";

function simplifyConfigurationAttributes(configurationAttributes, mainDomain = null) {
    if (configurationAttributes == null) return null;

    let simplified = [];
    for (let configurationAttribute of normalizeConfigurationAttributes(configurationAttributes)) {
        if (configurationAttribute != null) {
            let simplifiedConfigurationAttribute = copyFromTemplate(configurationAttribute, defaultConfigurationAttributes);           
            if (simplifiedConfigurationAttribute.groups != null && simplifiedConfigurationAttribute.groups.length > 0) {
                simplifiedConfigurationAttribute.groups = simplifyGroups(simplifiedConfigurationAttribute.groups, mainDomain);
            }            
            simplified.push(simplifiedConfigurationAttribute);
        }
    }
    return simplified;
}

function simplifyGroups(groups, mainDomain = null) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            simplified.push(removeLocalDomain(group, mainDomain));
        }
    }

    return simplified;
}

export default simplifyConfigurationAttributes;