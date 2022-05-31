function reorganizeClassPerms(classPerms) {
    if (classPerms != null) {
        for (let classPerm of classPerms) {
            if (classPerm.write) {
                classPerm.write = classPerm.write.sort();
            }
            if (classPerm.read) {
                classPerm.read = classPerm.read.sort();
            }
        }

        classPerms = classPerms.sort((a, b) => {
            return a.table.toLowerCase().localeCompare(b.table.toLowerCase())
        });
    }
    return classPerms;
}

export default reorganizeClassPerms;