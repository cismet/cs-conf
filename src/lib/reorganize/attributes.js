function reorganizeAttributes(attributes) {
    if (attributes != null) {
        for (let attribute of attributes) {
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
        }
        attributes = attributes.sort((a, b) => { 
            return a.field.localeCompare(b.field);
        });
    }
    
    return attributes;
}

export default reorganizeAttributes;