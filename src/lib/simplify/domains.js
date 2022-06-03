import normalizeDomains from "../normalize/domains";
import { copyFromTemplate, defaultDomain } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyDomains(domains) {
    if (domains == null) return null;

    let simplified = [];
    for (let domain of normalizeDomains(domains)) {
        if (domain != null) {
            let simplifiedDomain = copyFromTemplate(domain, defaultDomain);
            if (domain.configurationAttributes !== undefined) {
                simplifiedDomain.configurationAttributes = simplifyConfigurationAttributes(domain.configurationAttributes);
            }
            simplified.push(simplifiedDomain);
        }
    }
    return simplified;
}

export default simplifyDomains;