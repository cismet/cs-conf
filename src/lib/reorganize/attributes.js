function reorganizeAttributes(attributes) {
    if (attributes != null) {
        attributes = attributes.sort((a, b) => { 
            return a.field.localeCompare(b.field);
        });
    }
    
    return attributes;
}

export default reorganizeAttributes;