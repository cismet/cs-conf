import util from "util";
import normalizeAttributes from "../normalize/attributes";
import { copyFromTemplate, defaultAttribute, defaultAttributePrimary, defaultAttributedefaultClass } from "../tools/defaultObjects";

function simplifyAttributes(attributes, pk = defaultClass.pk, table) {
    if (attributes == null) return null;

    let simplified = [];
    for (let attribute of normalizeAttributes(attributes, pk, table)) {
        if (attribute != null && attribute.field != null) {
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (pk !== undefined && attribute.field == pk) {
                let simplifiedPkAttribute = copyFromTemplate(attribute, Object.assign({}, defaultAttributePrimary(table, pk)));
                if (simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')", table)) {
                    delete simplifiedPkAttribute.defaultValue;
                }
                if (simplifiedAttribute.name == simplifiedAttribute.field) {
                    delete simplifiedAttribute.name;
                }
                if (Object.entries(simplifiedPkAttribute).length > 0) {
                    simplified.push(Object.assign({field: pk}, simplifiedPkAttribute));
                }
            } else {
                if (simplifiedAttribute.name == simplifiedAttribute.field) {
                    delete simplifiedAttribute.name;
                }
                simplified.push(simplifiedAttribute);
            }
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyAttributes;