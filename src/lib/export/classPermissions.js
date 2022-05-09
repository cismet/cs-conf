import * as stmnts from './statements';
import util from 'util';

const exportClassPermissions = async (client, cidsClasses) => {
    const {
        rows: classPermResult
    } = await client.query(stmnts.classPermissions);
    return analyzeAndPreprocess(classPermResult, cidsClasses);
}
export function analyzeAndPreprocess(classPermResult, cidsClasses) {
    let classReadPerms = new Map();
    let classWritePerms = new Map();
    for (let cp of classPermResult) {
        let ug = util.format("%s@%s", cp.group, cp.domain);
        let tableReadPermissions = classReadPerms.get(cp.table);
        if (cp.permission === "read") {
            if (!tableReadPermissions) {
                tableReadPermissions = [];
                classReadPerms.set(cp.table, tableReadPermissions);
            }
            tableReadPermissions.push(ug);
        } else if (cp.permission === "write") {
            let tableWritePermissions = classWritePerms.get(cp.table);
            if (!tableWritePermissions) {
                tableWritePermissions = [];
                classWritePerms.set(cp.table, tableWritePermissions);
            }
            tableWritePermissions.push(ug);
        }
    }
    let cPermByTable = [];
    let normalizedCPerms = new Map();
    for (let c of cidsClasses) {
        let t = c.table;
        let tableReadPermissions = classReadPerms.get(c.table);
        let tableWritePermissions = classWritePerms.get(c.table);
        let entry = {
            table: t
        }
        let normKey = "";
        if (tableReadPermissions) {
            entry.read = tableReadPermissions.sort();
            normKey += "read:::" + JSON.stringify(entry.read);
        }
        if (tableWritePermissions) {
            entry.write = tableWritePermissions.sort();
            normKey += "write:::" + JSON.stringify(entry.write);
        }
        if (tableReadPermissions || tableWritePermissions) {
            let tablesForPermissions = normalizedCPerms.get(normKey);
            if (!tablesForPermissions) {
                tablesForPermissions = [];
                normalizedCPerms.set(normKey, tablesForPermissions);
            }
            tablesForPermissions.push(t);
            cPermByTable.push(entry);
        }
    }
    let normalizedClassPermResult = [];
    //normalized Permissions 
    normalizedCPerms.forEach((tables) => {
        let entry = {
            tables
        }
        let rp = classReadPerms.get(tables[0]);
        let wp = classWritePerms.get(tables[0]);
        if (rp) {
            entry.read = rp;
        }
        if (wp) {
            entry.write = wp;
        }
        normalizedClassPermResult.push(entry);
    });
    return {
        cPermByTable,
        normalizedClassPermResult,
        classReadPerms,
        classWritePerms
    }

}
export default exportClassPermissions;