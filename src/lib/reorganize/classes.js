function reorganizeClasses(classes) {
    if (classes != null) {
        for (let clazz of classes) {
            if (clazz.attributes != null) {
                clazz.attributes = clazz.attributes.sort((a, b) => { 
                    let aField = a.field.toLowerCase();
                    let bField = b.field.toLowerCase();
                    return aField.localeCompare(bField);
                });
            }
        }
        // TODO additionalattributes (which is a Map, not an array) ?

        classes = classes.sort((a, b) => {
            return a.table.toLowerCase().localeCompare(b.table.toLowerCase())
        });
    }
    
    return classes;
}

export default reorganizeClasses;