import normalizeDomains from "../normalize/domains";
import { copyFromTemplate, defaultDomain } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyDomains(domains, mainDomain = null) {
    if (domains == null) return null;

    let simplifiedBeforeLocal = [];
    let simpleMain = null;
    let domainnames = [];
    for (let domain of normalizeDomains(domains, mainDomain)) {
        if (domain != null) {
            domainnames.push(domain.domainname);
            if (domain.domainname == mainDomain && domain.configurationAttributes.length == 0 && domain.comment == null) {
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
                simplified.unshift(copyFromTemplate(Object.assign({}, domain, { 
                    domainname: simpleMain.domainname,
                }), defaultDomain));                
            } else {
                simplified.push(domain);
            }
        } else {
            simplified.push(domain);
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyDomains;