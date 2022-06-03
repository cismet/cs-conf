import util from 'util';
import { defaultAttribute } from "../tools/defaultObjects";

function normalizeAttributes(attributes) {
    let normalized = [];

    let defaulValueWarning = false;
    if (attributes !== undefined) {
        for (let attribute of attributes) {
            if (attribute.field == null) throw "missing field";

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
            
            if (
                attribute.dbType == null &&
                attribute.cidsType == null &&
                attribute.oneToMany == null &&
                attribute.manyToMany == null                
            ) throw "either dbType or cidsType or oneToMany or manyToMany missing";
            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw "precision and scale can only be set if dbType is set";

            normalized.push(Object.assign({}, defaultAttribute, attribute, {
                name: attribute.name || attribute.field,
                defaultValue,
            }));
        }
    }

    if (defaulValueWarning) {
        console.log(" !!!!!!!!!!!!!!!");
        console.log(" !!! WARNING !!! usage of typo 'defaulValue' in classes.js. This should by changed to the correct spelling 'defaultValue'. The typo is still interpreted though.");
        console.log(" !!!!!!!!!!!!!!!");
    }

    return normalized;
}

export default normalizeAttributes;