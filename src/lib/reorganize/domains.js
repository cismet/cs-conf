function reorganizeDomains(domains) {
    if (domains != null) {
        for (let domain of domains) {
            if (domain.configurationAttributes) {
                domain.configurationAttributes = domain.configurationAttributes.sort((a, b) => { 
                    let aKey = a.key;
                    let bKey = b.key;
                    return aKey.localeCompare(bKey);
                });
            }
        }

        domains = domains.sort((a, b) => {
            let aDomainname = a.domainname.toUpperCase();
            let bDomainname = b.domainname.toUpperCase();        
            return aDomainname != 'LOCAL' || aDomainname.localeCompare(bDomainname);
        });
    }        
    return domains;
}

export default reorganizeDomains;