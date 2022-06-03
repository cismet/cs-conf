import normalizeAttributes from "../normalize/attributes";
import { copyFromTemplate, defaultAttribute } from "../tools/defaultObjects";

function simplifyAttributes(attributes) {
    if (attributes == null) return null;

    let simplified = [];
    for (let attribute of normalizeAttributes(attributes)) {
        if (attribute != null) {
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (simplifiedAttribute.name == simplifiedAttribute.field) {
                delete simplifiedAttribute.name;
            }
            simplified.push(simplifiedAttribute);
        }
    }
    return simplified;
}

export default simplifyAttributes;