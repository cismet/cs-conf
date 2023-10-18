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

        if (Object.keys(domain.additional_info).length > 0) {
            additionalInfos.domain[domainKey] = Object.assign({type: 'domain'}, domain.additional_info);
        }        
    }
    return { csDomainEntries };
}

export default prepareDomains;