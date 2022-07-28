import createPermsEntry from './perms';

function prepareClassPermissions(classPerms) {
    let csClassPermEntries = [];
    for (let classPerm of classPerms) {
        if (classPerm.read) {
            for (let groupkey of classPerm.read) {
                csClassPermEntries.push(createPermsEntry(groupkey, classPerm.table, "read", csClassPermEntries.length + 1));
            }
        }
        if (classPerm.write) {
            for (let groupkey of classPerm.write) {
                csClassPermEntries.push(createPermsEntry(groupkey, classPerm.table, "write", csClassPermEntries.length + 1));
            }
        }  
    }
    return { csClassPermEntries };
}

export default prepareClassPermissions;