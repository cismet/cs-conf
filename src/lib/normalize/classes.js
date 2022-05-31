import { defaultAttribute, defaultClass } from "./_defaultObjects";

function normalizeClasses(classes) {
    let normalized = [];
    
    if (classes !== undefined) {
        for (let clazz of classes) {
            if (clazz.table == null) throw "missing table for class";

            normalized.push(Object.assign({}, defaultClass, clazz, {
                name: clazz.name != null ? clazz.name : clazz.table,
                toString: normalizeSpecial(clazz.toString),
                editor: normalizeSpecial(clazz.editor),
                renderer: normalizeSpecial(clazz.renderer),
                attributes: normalizeAttributes(clazz.attributes),
            }));
        }
    }
    
    return normalized;
}

function normalizeAttributes(attributes) {
    let normalized = [];

    if (attributes !== undefined) {
        for (let attribute of attributes) {
            if (attribute.field == null) throw "missing field";

            if (
                attribute.dbType == null &&
                attribute.cidsType == null &&
                attribute.oneToMany == null &&
                attribute.manyToMany == null                
            ) throw "either dbType or cidsType or oneToMany or manyToMany missing";
            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw "precision and scale can only be set if dbType is set";

            normalized.push(Object.assign({}, defaultAttribute, attribute, {
                name: attribute.name != null ? attribute.name : attribute.field,
            }));
        }
    }

    return normalized;
}

function normalizeSpecial(special) {
    // exclude toString()
    if (typeof special !== 'function' && special != null) {
        if (special.type == null) throw "type missing" ;
        if (special.class == null) throw "class missing";
        return {
            type: special.type,
            class: special.class,
        };    
    }
    return null;
}

export default normalizeClasses;