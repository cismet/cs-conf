function prepareDomains({ domains, configurationAttributes, additionalInfos }) {
    let csDomainEntries = [];
    for (let domain of domains) {
        let domainKey = domain.domainname;
        csDomainEntries.push([ 
            domainKey,
            csDomainEntries.length + 1,
        ]);

        if (domain.configurationAttributes) {
            for (let configurationAttribute of domain.configurationAttributes) {
                configurationAttribute.domain = domainKey;
                configurationAttributes.push(configurationAttribute);
            } 
        }
    }
    return { csDomainEntries };
}

export default prepareDomains;