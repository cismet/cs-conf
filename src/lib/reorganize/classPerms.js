import reorganizePerms from "./perms";

function reorganizeClassPerms(classPerms) {
    if (classPerms != null) {
        for (let classPerm of classPerms) {
            if (classPerm.write) {
                classPerm.write = reorganizePerms(classPerm.write);
            }
            if (classPerm.read) {
                classPerm.read = reorganizePerms(classPerm.read);
            }
        }

        classPerms = classPerms.sort((a, b) => {
            return a.table.toLowerCase().localeCompare(b.table.toLowerCase())
        });
    }
    return classPerms;
}

export default reorganizeClassPerms;