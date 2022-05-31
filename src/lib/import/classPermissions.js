import createPermsEntry from './perms';

function prepareClassPermissions(classPerms) {
    let csClassPermEntries = [];
    for (let classPerm of classPerms) {
        if (classPerm.read) {
            for (let groupkey of classPerm.read) {
                csClassPermEntries.push(createPermsEntry(groupkey, classPerm.table, "read"));
            }
        }
        if (classPerm.write) {
            for (let groupkey of classPerm.write) {
                csClassPermEntries.push(createPermsEntry(groupkey, classPerm.table, "write"));
            }
        }  
    }
    return { csClassPermEntries };
}

export default prepareClassPermissions;