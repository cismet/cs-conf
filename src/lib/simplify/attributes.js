import normalizeAttributes from "../normalize/attributes";
import { copyFromTemplate, defaultAttribute, defaultClass } from "../tools/defaultObjects";

function simplifyAttributes(attributes, pk = defaultClass.pk) {
    if (attributes == null) return null;

    let simplified = [];
    for (let attribute of normalizeAttributes(attributes, pk)) {
        if (attribute != null && attribute.field != null) {
            if (pk !== undefined && attribute.field == pk) {
                continue;
            }
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (simplifiedAttribute.name == simplifiedAttribute.field) {
                delete simplifiedAttribute.name;
            }
            simplified.push(simplifiedAttribute);
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyAttributes;