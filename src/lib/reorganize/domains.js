import reorganizeConfigurationAttributes from "./configurationAttributes";

function reorganizeDomains(domains) {
    if (domains != null) {
        for (let domain of domains) {
            if (domain.configurationAttributes) {
                domain.configurationAttributes = reorganizeConfigurationAttributes(domain.configurationAttributes);
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