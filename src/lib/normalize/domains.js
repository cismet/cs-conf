import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDomain } from "../tools/defaultObjects";
import util from 'util';

function normalizeDomains(domains, mainDomain) {
    let normalized = [];

    if (domains != null) {
        let localDomain = null;
        let domainnames = [];
        for (let domain of domains) {
            if (domain.domainname == null) throw "normalizeDomains: missing domainname";
            if (domainnames.includes(domain.domainname)) throw util.format("normalizeDomains: domain '%s' already exists", domain.domainname);

            if (domain.domainname == mainDomain || domains.length == 1) {
                if (localDomain != null) {
                    throw util.format("normalizeDomains: can't set %s as main, %s is already main", domain.domainname, localDomain.domainname);
                }
                localDomain = domain;
            } else {
                domainnames.push(domain.domainname);
                normalized.push(Object.assign({}, defaultDomain, domain, {
                    configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
                }));
    
            }
        }

        if (localDomain != null) {
            if (!domainnames.includes("LOCAL")) {
                normalized.push(Object.assign({}, defaultDomain, localDomain, { domainname: "LOCAL" }, {
                    configurationAttributes: normalizeConfigurationAttributes(localDomain.configurationAttributes)
                }));    
            }

            if (!domainnames.includes(localDomain.domainname)) {
                normalized.push(Object.assign({}, defaultDomain, { domainname: localDomain.domainname }));            
            }
        }
    }

    return normalized;
}

export default normalizeDomains;