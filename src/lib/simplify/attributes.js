import util from "util";
import normalizeAttributes from "../normalize/attributes";
import { copyFromTemplate, defaultAttribute, defaultClass } from "../tools/defaultObjects";

function simplifyAttributes(attributes, pk = defaultClass.pk, table) {
    if (attributes == null) return null;

    let simplified = [];
    for (let attribute of normalizeAttributes(attributes, pk, table)) {
        if (attribute != null && attribute.field != null) {
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (pk !== undefined && attribute.field == pk) {
                let simplifiedPkAttribute = copyFromTemplate(attribute, Object.assign({}, defaultAttribute, {
                    field: attribute.field,
                    name: attribute.field,
                    dbType: "INTEGER",
                    mandatory: true,
                }));
                if (
                    simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')", table) ||
                    simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')::text", table) ||
                    simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq'::regclass)", table) 
                ) {
                    delete simplifiedPkAttribute.defaultValue;
                }

                if (Object.entries(simplifiedPkAttribute).length == 0) {
                    continue;
                }
            }

            if (simplifiedAttribute.name == simplifiedAttribute.field) {
                delete simplifiedAttribute.name;
            }

            simplified.push(simplifiedAttribute);
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyAttributes;