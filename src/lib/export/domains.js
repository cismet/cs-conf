import { defaultDomain } from '../tools/defaultObjects';

function exportDomains({ csDomains }, { config, domainConfigAttrs }) {
    let mainDomain = config.domainName;
    
    let domains = [];
    let mainDomainFound = false
    for (let csDomain of csDomains) {
        let domain = Object.assign({}, csDomain);
        
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = attributes;        
        }
        if (domain.domainname == mainDomain) {
            mainDomainFound = true;
        }
        domains.push(domain);
    }
    if (!mainDomainFound) {
        domains.push(Object.assign({}, defaultDomain, { "domainname" : mainDomain }));
    }
    return { domains };
}

export default exportDomains;