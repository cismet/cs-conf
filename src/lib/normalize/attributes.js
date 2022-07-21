import util from "util";
import { defaultAttribute, defaultClass } from "../tools/defaultObjects";
import { logWarn } from "../tools/tools";

function normalizeAttributes(attributes, pk = defaultClass.pk, table) {
    let normalized = [];

    if (attributes !== undefined) {
        let pkMissing = true;
        let pkDummy = Object.assign({}, defaultAttribute, {
            dbType: "INTEGER",
            mandatory: true,
            defaultValue: util.format("nextval('%s_seq')", table),
        });
        for (let attribute of attributes) {
            if (attribute.field == null) throw util.format("normalizeAttributes: [%s] missing field for attribute", table);

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

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", table, attribute.field);

            if (pk !== undefined && attribute.field == pk) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw "normalizeAttributes: primary key can only have dbType, no cidsType allowed";
                
                normalized.push(Object.assign({}, pkDummy, attribute, {
                    defaultValue: attribute.defaultValue || util.format("nextval('%s_seq')", table),
                }));    
            } else {
                let types = [];
                if (attribute.dbType != null) types.push(attribute.dbType);
                if (attribute.cidsType != null) types.push(attribute.cidsType);
                if (attribute.oneToMany != null) types.push(attribute.oneToMany);
                if (attribute.manyToMany != null) types.push(attribute.manyToMany);

                if (types.length == 0) throw util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", table, attribute.field);    
                if (types.length > 1) throw util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", table, attribute.field);    

                normalized.push(Object.assign({}, defaultAttribute, attribute, {
                    name: attribute.name || attribute.field,
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

    return normalized;
}

export default normalizeAttributes;