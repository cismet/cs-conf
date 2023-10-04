import { normalizeClass } from "../normalize/classes";

function reorganizeClasses(classes) {
    if (classes != null) {
        for (let clazz of classes) {
            if (normalizeClass(clazz).attributesOrder == "auto") {
                if (clazz.attributes != null) {
                    clazz.attributes = clazz.attributes.sort((a, b) => { 
                        return a.field.localeCompare(b.field);
                    });                
                }
            }
        }
        // TODO additionalattributes (which is a Map, not an array) ?

        classes = classes.sort((a, b) => {
            return a.table.localeCompare(b.table)
        });
    }
    
    return classes;
}

export default reorganizeClasses;