function reorganizeConfigurationAttributes(configurationAttributes) {
    if (configurationAttributes == null) return null;
    
    return configurationAttributes.sort((a, b) => { 
        let aKey = a.key;
        let bKey = b.key;
        return aKey.localeCompare(bKey);
    });
}

export default reorganizeConfigurationAttributes;