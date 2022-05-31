import normalizeAttributes from "./attributes";
import { defaultClass } from "./_defaultObjects";

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
                classIcon: clazz.classIcon || clazz.icon || null,
                objectIcon: clazz.objectIcon || clazz.icon || null,
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