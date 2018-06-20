import * as stmnts from './statements';

const exportDomains = async (client, domainConfigAttrs) => {
    const {
        rows: domainArray
    } = await client.query(stmnts.domains);
    return analyzeAndPreprocess(domainArray, domainConfigAttrs);
}
export function analyzeAndPreprocess(domainArray, domainConfigAttrs) {
    for (let domain of domainArray) {
        //add the configuration attributes
        let attributes = domainConfigAttrs.get(domain.domainname);
        if (attributes) {
            domain.configurationAttributes = attributes;
        }
    }
    return domainArray;
}
export default exportDomains;