import util from "util";
import { defaultAttribute, defaultClass } from "../tools/defaultObjects";
import { logWarn } from "../tools/tools";

function normalizeAttributes(attributes, pk = defaultClass.pk, table) {
    let normalized = [];

    let defaulValueWarning = false;
    if (attributes !== undefined) {
        let pkMissing = true;
        let pkDummy = Object.assign({}, defaultAttribute, {
            dbType: "INTEGER",
            mandatory: true,
            defaultValue: util.format("nextval('%s_seq')", table),
        });
        for (let attribute of attributes) {
            if (attribute.field == null) throw "normalizeAttributes: missing field";

            if (attribute.field != null) {
                attribute.field = attribute.field.toLowerCase();
            }
            if (attribute.cidsType != null) {
                attribute.cidsType = attribute.cidsType.toLowerCase();
            }
            if (attribute.oneToMany != null) {
                attribute.oneToMany = attribute.oneToMany.toLowerCase();
            }
            if (attribute.manyToMany != null) {
                attribute.manyToMany = attribute.manyToMany.toLowerCase();
            }

            let defaultValue = attribute.defaultValue !== undefined ? attribute.defaultValue : null;
            if (attribute.defaulValue != null) {
                defaulValueWarning = true;
                if (defaultValue == null) {
                    defaultValue = attribute.defaulValue;
                }
            }

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw "normalizeAttributes: precision and scale can only be set if dbType is set";

            if (pk !== undefined && attribute.field == pk) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw "normalizeAttributes: primary key can only have dbType, no cidsType allowed";
                
                normalized.push(Object.assign({}, pkDummy, attribute, {
                    defaultValue: defaultValue || util.format("nextval('%s_seq')", table),
                }));    
            } else {
                let types = [];
                if (attribute.dbType != null) types.push(attribute.dbType);
                if (attribute.cidsType != null) types.push(attribute.cidsType);
                if (attribute.oneToMany != null) types.push(attribute.oneToMany);
                if (attribute.manyToMany != null) types.push(attribute.manyToMany);

                if (types.length == 0) throw "normalizeAttributes: either dbType or cidsType or oneToMany or manyToMany missing";    
                if (types.length > 1) throw "normalizeAttributes: type has to be either dbType or cidsType or oneToMany or manyToMany";    

                normalized.push(Object.assign({}, defaultAttribute, attribute, {
                    name: attribute.name || attribute.field,
                    defaultValue,
                }));    
            }
        }
        if (pkMissing) {
            normalized.unshift(Object.assign({}, pkDummy, {
                field: pk,
                name: pk,
            }));
        }
    }

    if (defaulValueWarning) {
        logWarn("usage of typo 'defaulValue' in classes.js. This should by changed to the correct spelling 'defaultValue'. The typo is still interpreted though.");
    }

    return normalized;
}

export default normalizeAttributes;