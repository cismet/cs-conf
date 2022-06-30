import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDomain } from "../tools/defaultObjects";
import util from 'util';

function normalizeDomains(domains) {
    let normalized = [];

    if (domains !== undefined) {
        let main = null;
        let domainnames = [];
        for (let domain of domains) {
            if (domain.domainname == null) throw "missing domainname";
            if (domainnames.includes(domain.domainname)) throw util.format("domain '%s' already exists", domain.domainname);

            if (domain.main === true || domains.length == 1) {
                if (main != null) {
                    throw util.format("can't set %s as main, %s is already main", domain.domainname, main.domainname);
                }
                main = Object.assign(domain, { main: true });
            } else {
                domainnames.push(domain.domainname);
                normalized.push(Object.assign({}, defaultDomain, domain, {
                    configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
                }));
    
            }
        }

        if (main != null) {
            if (!domainnames.includes("LOCAL")) {
                normalized.push(Object.assign({}, defaultDomain, main, { main: false, domainname: "LOCAL" }, {
                    configurationAttributes: normalizeConfigurationAttributes(main.configurationAttributes)
                }));    
            }

            if (!domainnames.includes(main.domainname)) {
                normalized.push(Object.assign({}, defaultDomain, { main: true, domainname: main.domainname }));            
            }
        }
    }

    return normalized;
}

export default normalizeDomains;