import { exit } from 'process';
import util from 'util';

function exportClassPermissions({ csUgClassPerms }, { classes }) {
    let classReadPerms = new Map();
    let classWritePerms = new Map();

    for (let csUgClassPerm of csUgClassPerms) {
        let ug = util.format("%s@%s", csUgClassPerm.group, csUgClassPerm.domain);
        let tableReadPermissions = classReadPerms.get(csUgClassPerm.table);
        if (csUgClassPerm.permission === "read") {
            if (!tableReadPermissions) {
                tableReadPermissions = [];
                classReadPerms.set(csUgClassPerm.table, tableReadPermissions);
            }
            tableReadPermissions.push(ug);
        } else if (csUgClassPerm.permission === "write") {
            let tableWritePermissions = classWritePerms.get(csUgClassPerm.table);
            if (!tableWritePermissions) {
                tableWritePermissions = [];
                classWritePerms.set(csUgClassPerm.table, tableWritePermissions);
            }
            tableWritePermissions.push(ug);
        }
    }

    let classPerms = [];
    for (let clazz of classes) {
        let table = clazz.table;
        let classPerm = {
            table: table
        }
        let tableReadPermissions = classReadPerms.get(table);
        if (tableReadPermissions) {
            classPerm.read = tableReadPermissions;
        }
        let tableWritePermissions = classWritePerms.get(table);
        if (tableWritePermissions) {
            classPerm.write = tableWritePermissions;
        }
        if (tableReadPermissions || tableWritePermissions) {
            classPerms.push(classPerm);
        }
    }

    return {
        classPerms
    }

}

export default exportClassPermissions;