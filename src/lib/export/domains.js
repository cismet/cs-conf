import * as stmnts from './statements';

const exportDomains = async (client, domainConfigAttrs) => {
    const {
        rows: domains
    } = await client.query(stmnts.domains);
    return analyzeAndPreprocess(domains, domainConfigAttrs);
}
export function analyzeAndPreprocess(domains, domainConfigAttrs) {
    for (let domain of domains) {
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = attributes;
        }
    }
    return domains;
}
export default exportDomains;