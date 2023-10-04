import util from 'util';
import normalizeAttributes from "./attributes";
import { defaultClass } from "../tools/defaultObjects";

export default function normalizeClasses(classes) {
    let normalized = [];
    
    if (classes != null) {
        for (let clazz of classes) {
            let normalizedClass = normalizeClass(clazz);
            normalized.push(normalizedClass);                
        }
    }
    return normalized;
}

export function normalizeClass(clazz) {
    if (clazz.table == null) throw "normalizeClasses: missing table for class";
    //if (clazz.table !== clazz.table.toUpperCase()) throw util.format("normalizeClasses: table '%s' has to be uppercase", clazz.table);
    if (clazz.pk === null) throw util.format("normalizeClasses: [%s] pk of can't be null", clazz.table);
    //if (clazz.pk !== undefined && clazz.pk !== clazz.pk.toUpperCase()) throw util.format("normalizeClasses: pk '%s' has to be uppercase", clazz.pk);
    //if (clazz.cidsType !== undefined && clazz.cidsType !== clazz.cidsType.toUpperCase()) throw util.format("normalizeClasses: cidsType '%s' has to be uppercase", clazz.cidsType);
    //if (clazz.oneToMany !== undefined && clazz.oneToMany !== clazz.oneToMany.toUpperCase()) throw util.format("normalizeClasses: oneToMany '%s' has to be uppercase", clazz.oneToMany);
    //if (clazz.manyToMany !== undefined && clazz.manyToMany !== clazz.manyToMany.toUpperCase()) throw util.format("normalizeClasses: manyToMany '%s' has to be uppercase", clazz.manyToMany);

    if (clazz.table != null) {
        clazz.table = clazz.table.toLowerCase();
    }            
    if (clazz.pk != null) {
        clazz.pk = clazz.pk.toLowerCase();
    }            

    return Object.assign({}, defaultClass, clazz, {
        name: clazz.name != null ? clazz.name : clazz.table,
        toString: normalizeSpecial(clazz.toString, clazz.table),
        editor: normalizeSpecial(clazz.editor, clazz.table),
        renderer: normalizeSpecial(clazz.renderer, clazz.table),
        attributes: normalizeAttributes(clazz.attributes, clazz.pk, clazz.table),
        icon: null,
        classIcon: clazz.classIcon || clazz.icon || null,
        objectIcon: clazz.objectIcon || clazz.icon || null,
    });
}

function normalizeSpecial(special, table) {
    // exclude toString()
    if (typeof special !== 'function' && special != null) {
        if (special.type == null) throw util.format("normalizeClasses: [%s] type missing", table);
        if (special.class == null) throw util.format("normalizeClasses: [%s] class missing", table);
        return {
            type: special.type,
            class: special.class,
        };    
    }
    return null;
}
