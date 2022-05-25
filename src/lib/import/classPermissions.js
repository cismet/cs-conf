import * as cidstools from '../tools/cids';

function prepareClassPermissions(classPerms) {
    // cs_domain
    let csClassPermEntries = [];
    for (let p of classPerms) {
        if (p.read) {
            for (let groupkey of p.read) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csClassPermEntries.push([
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
                csClassPermEntries.push([
                    group,
                    domain,
                    p.table,
                    "write"
                ]);
            }
        }  
    }

    return { csClassPermEntries };
}

export default prepareClassPermissions;