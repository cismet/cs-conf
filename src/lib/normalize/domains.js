import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDomain } from "../tools/defaultObjects";
import util from 'util';

function normalizeDomains(domains) {
    let normalized = [];

    if (domains != null) {
        let mainDomain = null;
        let domainnames = [];
        for (let domain of domains) {
            if (domain.domainname == null) throw "normalizeDomains: missing domainname";
            if (domainnames.includes(domain.domainname)) throw util.format("normalizeDomains: domain '%s' already exists", domain.domainname);

            if (domain.domainname == global.config.domainName || domains.length == 1) {
                if (mainDomain != null) {
                    throw util.format("normalizeDomains: can't set %s as main, %s is already main", domain.domainname, mainDomain.domainname);
                }
                mainDomain = domain;
            } else {
                domainnames.push(domain.domainname);
                normalized.push(Object.assign({}, defaultDomain, domain, {
                    configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
                }));
    
            }
        }

        if (mainDomain != null) {
            if (!domainnames.includes("LOCAL")) {
                normalized.push(Object.assign({}, defaultDomain, mainDomain, { domainname: "LOCAL" }, {
                    configurationAttributes: normalizeConfigurationAttributes(mainDomain.configurationAttributes)
                }));    
            }

            if (!domainnames.includes(mainDomain.domainname)) {
                normalized.push(Object.assign({}, defaultDomain, { domainname: mainDomain.domainname }));            
            }
        }
    }

    return normalized;
}

export default normalizeDomains;