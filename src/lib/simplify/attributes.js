import { copyFromTemplate, defaultAttribute } from "../tools/defaultObjects";

function simplifyAttributes(attributes) {
    if (attributes == null) return null;

    let simplified = [];
    if (attributes != null) {
        for (let attribute of attributes) {
            if (attribute != null) {
                let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
                if (simplifiedAttribute.name == simplifiedAttribute.field) {
                    delete simplifiedAttribute.name;
                }
                simplified.push(simplifiedAttribute);
            }
        }
    }        
    return simplified;
}

export default simplifyAttributes;