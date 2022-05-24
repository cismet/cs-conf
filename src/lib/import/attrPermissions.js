import * as cidstools from '../tools/cids';

export function prepareAttributePermissions(attrPerms) {
    let csAttrPermEntries = [];
    for (let p of attrPerms) {
        if (p.read) {
            for (let groupkey of p.read) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csAttrPermEntries.push([
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
                csAttrPermEntries.push([
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

export default prepareAttributePermissions;