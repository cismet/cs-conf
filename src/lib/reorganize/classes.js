import reorganizeAttributes from "./attributes";

function reorganizeClasses(classes) {
    if (classes != null) {
        for (let clazz of classes) {
            if (clazz.attributes != null) {
                clazz.attributes = reorganizeAttributes(clazz.attributes);
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