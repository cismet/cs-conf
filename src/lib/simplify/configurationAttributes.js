import normalizeConfigurationAttributes from "../normalize/configurationAttributes";
import { copyFromTemplate, defaultConfigurationAttributes } from "../tools/defaultObjects";

function simplifyConfigurationAttributes(configurationAttributes) {
    if (configurationAttributes == null) return null;

    let simplified = [];
    for (let configurationAttribute of normalizeConfigurationAttributes(configurationAttributes)) {
        if (configurationAttribute != null) {
            let simplifiedConfigurationAttribute = copyFromTemplate(configurationAttribute, defaultConfigurationAttributes);                
            simplified.push(simplifiedConfigurationAttribute);
        }
    }
    return simplified;
}

export default simplifyConfigurationAttributes;