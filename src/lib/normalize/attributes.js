import { defaultAttribute } from "./_defaultObjects";

function normalizeAttributes(attributes) {
    let normalized = [];

    let defaulValueWarning = false;
    if (attributes !== undefined) {
        for (let attribute of attributes) {
            if (attribute.field == null) throw "missing field";
            
            let defaultValue = attribute.defaultValue;
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