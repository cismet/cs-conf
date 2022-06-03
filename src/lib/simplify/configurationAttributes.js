import { copyFromTemplate, defaultConfigurationAttributes } from "../tools/defaultObjects";

function simplifyConfigurationAttributes(configurationAttributes) {
    if (configurationAttributes == null) return null;

    let simplified = [];
    if (configurationAttributes != null) {
        for (let configurationAttribute of configurationAttributes) {
            if (configurationAttribute != null) {
                let simplifiedConfigurationAttribute = copyFromTemplate(configurationAttribute, defaultConfigurationAttributes);                
                simplified.push(simplifiedConfigurationAttribute);
            }
        }
    }
    return simplified;
}

export default simplifyConfigurationAttributes;