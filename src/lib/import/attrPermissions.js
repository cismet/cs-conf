import createPermsEntry from './perms';

function prepareAttributePermissions(attrPerms) {
    let csAttrPermEntries = [];
    for (let attrPerm of attrPerms) {
        if (attrPerm.read) {
            for (let groupkey of attrPerm.read) {
                csAttrPermEntries.push(createPermsEntry(groupkey, attrPerm.table, "read"));
            }
        }
        if (attrPerm.write) {
            for (let groupkey of attrPerm.write) {
                csAttrPermEntries.push(createPermsEntry(groupkey, attrPerm.table, "write"));
            }
        }  
    }
    return { csAttrPermEntries };
}

export default prepareAttributePermissions;