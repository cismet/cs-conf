import * as stmnts from './statements';

async function exportDomains(client, domainConfigAttrs, reorganize = false) {
    const {
        rows: domains
    } = await client.query(reorganize ? stmnts.domainsByKey : stmnts.domainsById);
    return analyzeAndPreprocess(domains, domainConfigAttrs, reorganize);
}

function analyzeAndPreprocess(domains, domainConfigAttrs, reorganize = false) {
    for (let domain of domains) {
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = reorganize ? attributes.sort((a, b) => { 
                let aKey = a.key;
                let bKey = b.key;
                return aKey.localeCompare(bKey);
            }) : attributes;
        }
    }
    return domains;
}

export default exportDomains;