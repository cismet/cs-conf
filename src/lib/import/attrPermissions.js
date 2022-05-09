import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';
import util from 'util';

export function prepareData(attrPerms) {
    // cs_domain
    let csAttrPermEntries=[];
    for (let p of attrPerms) {
        if (p.read) {
            for (let groupkey of p.read) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csAttrPermEntries.push(
                    [
                        group,
                        domain,
                        p.table,
                        "read"
                    ]);
            }
        }
        if (p.write) {
            for (let groupkey of p.write) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csAttrPermEntries.push(
                    [
                        group,
                        domain,
                        p.table,
                        "write"
                    ]);
            }
        }  
    }

    return { csAttrPermEntries };
}

const importAttrPermissions = async (client, attrPerms) => {
    const { csAttrPermEntries } = prepareData(attrPerms);
    console.log(util.format("importing attribute permission (%d)", csAttrPermEntries.length));
    await dbtools.nestedFiller(client,stmnts.complex_cs_attr_permission, csAttrPermEntries);
}

export default importAttrPermissions;