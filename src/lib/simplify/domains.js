import normalizeDomains from "../normalize/domains";
import { copyFromTemplate, defaultDomain } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyDomains(domains, mainDomain = null) {
    if (domains == null) return null;

    let simplifiedBeforeLocal = [];
    let simpleMain = null;
    let domainnames = [];
    for (let domain of normalizeDomains(domains)) {
        if (domain != null) {
            domainnames.push(domain.domainname);
            if (domain.main === true && domain.configurationAttributes.length == 0 && domain.comment == null) {
                simpleMain = domain;
            }
            let simplifiedDomain = copyFromTemplate(domain, defaultDomain);
            if (domain.configurationAttributes !== undefined && domain.configurationAttributes.length > 0) {
                simplifiedDomain.configurationAttributes = simplifyConfigurationAttributes(domain.configurationAttributes, mainDomain);
            }
            simplifiedBeforeLocal.push(simplifiedDomain);
        }
    }
    
    let simplified = [];
    for (let domain of simplifiedBeforeLocal) {  
        if (simpleMain != null) {
            if (domain.domainname === simpleMain.domainname) {
                continue;
            } else if (domain.domainname === "LOCAL") {
                domain.main = true;
                domain.domainname = simpleMain.domainname;
                simplified.push(copyFromTemplate(domain, defaultDomain));
            } else {
                simplified.push(domain);
            }
        } else {
            simplified.push(domain);
        }
    }

    if (simplified.length == 1) {
        simplified[0].main = undefined;
    }
    return simplified;
}

export default simplifyDomains;