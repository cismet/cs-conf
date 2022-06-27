import * as stmnts from './statements';

async function exportDomains(client, mainDomain, domainConfigAttrs) {
    const {
        rows: domains
    } = await client.query(stmnts.domains);
    return analyzeAndPreprocess(domains, mainDomain, domainConfigAttrs);
}

function analyzeAndPreprocess(domains, mainDomain, domainConfigAttrs) {
    for (let domain of domains) {
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = attributes;        
        }
        domain.main = domain.domainname == mainDomain;
    }
    return { domains };
}

export default exportDomains;