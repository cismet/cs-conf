import * as stmnts from './statements';
import util from 'util';

async function exportClassPermissions(classes) {
    let client = global.client;
    let {
        rows: classPermResult
    } = await client.query(stmnts.classPermissions);
    return analyzeAndPreprocess(classPermResult, classes);
}

function analyzeAndPreprocess(classPermResult, classes) {
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
    let classPerms = [];
    let normalizedCPerms = new Map();
    for (let c of classes) {
        let table = c.table;
        let entry = {
            table: table
        }
        //let normKey = "";
        let tableReadPermissions = classReadPerms.get(table);
        if (tableReadPermissions) {
            entry.read = tableReadPermissions;
            //normKey += "read:::" + JSON.stringify(entry.read);
        }
        let tableWritePermissions = classWritePerms.get(table);
        if (tableWritePermissions) {
            entry.write = tableWritePermissions;
            //normKey += "write:::" + JSON.stringify(entry.write);
        }
        if (tableReadPermissions || tableWritePermissions) {
            //let tablesForPermissions = normalizedCPerms.get(normKey);
            //if (!tablesForPermissions) {
                //tablesForPermissions = [];
                //normalizedCPerms.set(normKey, tablesForPermissions);
            //}
            //tablesForPermissions.push(table);
            classPerms.push(entry);
        }
    }
    /*let normalizedClassPerms = [];
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
        normalizedClassPerms.push(entry);
    });*/

    return {
        classPerms,
        //normalizedClassPerms,
        classReadPerms,
        classWritePerms
    }

}

export default exportClassPermissions;