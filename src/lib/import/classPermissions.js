import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';

export function prepareData(classPerms) {
    // cs_domain
    let csClassPermEntries=[];
    for (let p of classPerms) {
        if (p.read) {
            for (let groupkey of p.read) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csClassPermEntries.push(
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
                csClassPermEntries.push(
                    [
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

const importClassPermissions = async (client, classPerms) => {
    const { csClassPermEntries } = prepareData(classPerms);
    console.log("* importing class permission ("+csClassPermEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_class_permission, csClassPermEntries);
}

export default importClassPermissions;