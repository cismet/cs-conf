import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDomain } from "./_defaultObjects";

function normalizeDomains(domains) {
    let normalized = [];

    if (domains !== undefined) {
        for (let domain of domains) {
            if (domain.domainname == null) throw "missing domainname";

            normalized.push(Object.assign({}, defaultDomain, domain, {
                configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
            }));
        }
    }

    return normalized;
}

export default normalizeDomains;