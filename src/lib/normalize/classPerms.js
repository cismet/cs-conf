import normalizePerms from "./perms";
import { defaultClassPerm } from "../tools/defaultObjects";

function normalizeClassPerms(classPerms) {
    let normalized = [];
    
    if (classPerms !== undefined) {
        for (let classPerm of classPerms) {
            if (classPerm.table == null) throw "missing table for classPerm";

            normalized.push(Object.assign({}, defaultClassPerm, classPerm, {
                table: classPerm.table.toLowerCase(),
                read: normalizePerms(classPerm.read),
                write: normalizePerms(classPerm.write),
            }));
        }
    }

    return normalized;
}

export default normalizeClassPerms;