import * as stmnts from './statements';
import * as dbtools from '../tools/db';

export function prepareData(domains) {
    // cs_domain
    let csDomainEntries=[];
    for (let d of domains) {
        csDomainEntries.push([d.domainname]);
    }

    return { csDomainEntries };
}

const importDomains = async (client, domains) => {
    const { csDomainEntries } = prepareData(domains);
    await dbtools.singleRowFiller(client,stmnts.simple_cs_domain, csDomainEntries);
}

export default importDomains;