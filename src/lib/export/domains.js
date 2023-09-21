import { defaultDomain } from '../tools/defaultObjects';
import * as stmnts from './statements';

async function exportDomains(mainDomain, domainConfigAttrs) {
    let client = global.client;
    let {
        rows: domains
    } = await client.query(stmnts.domains);
    return analyzeAndPreprocess(domains, mainDomain, domainConfigAttrs);
}

function analyzeAndPreprocess(domains, mainDomain, domainConfigAttrs) {
    let mainDomainFound = false
    for (let domain of domains) {
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = attributes;        
        }
        if (domain.domainname == mainDomain) {
            mainDomainFound = true;
        }
    }
    if (!mainDomainFound) {
        domains.push(Object.assign({}, defaultDomain, { "domainname" : mainDomain }));
    }
    return { domains };
}

export default exportDomains;