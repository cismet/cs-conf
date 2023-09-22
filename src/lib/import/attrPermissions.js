import createPermsEntry from './perms';

function prepareAttributePermissions({ attrPerms }) {
    let csAttrPermEntries = [];
    for (let attrPerm of attrPerms) {
        if (attrPerm.read) {
            for (let groupkey of attrPerm.read) {
                csAttrPermEntries.push(createPermsEntry(groupkey, attrPerm.table, "read", csAttrPermEntries.length + 1));
            }
        }
        if (attrPerm.write) {
            for (let groupkey of attrPerm.write) {
                csAttrPermEntries.push(createPermsEntry(groupkey, attrPerm.table, "write", csAttrPermEntries.length + 1));
            }
        }  
    }
    return { csAttrPermEntries };
}

export default prepareAttributePermissions;