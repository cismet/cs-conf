import util from 'util';

function exportAttrPermissions({ csUgAttrPerms }, { attributes }) {
    let attrReadPerms = new Map();
    let attrWritePerms = new Map();

    for (let csUgAttrPerm of csUgAttrPerms) {
        let ug = util.format("%s@%s", csUgAttrPerm.group, csUgAttrPerm.domain);
        let key = util.format("%s.%s", csUgAttrPerm.table, csUgAttrPerm.field);
        let attrReadPermissions = attrReadPerms.get(key);
        if (csUgAttrPerm.permission === "read") {
            if (!attrReadPermissions) {
                attrReadPermissions = [];
                attrReadPerms.set(key, attrReadPermissions);
            }
            attrReadPermissions.push(ug);
        } else if (csUgAttrPerm.permission === "write") {
            let attrWritePermissions = attrWritePerms.get(key);
            if (!attrWritePermissions) {
                attrWritePermissions = [];
                attrWritePerms.set(key, attrWritePermissions);
            }
            attrWritePermissions.push(ug);
        }
    }
    
    let attrPerms = [];
    for (let attribute of attributes) {
        let key = util.format("%s.%s", attribute.table, attribute.field);
        let entry = {
            attribute: key
        }

        let attrReadPermissions = attrReadPerms.get(key);
        if (attrReadPermissions) {
            entry.read = attrReadPermissions;
        }

        let attrWritePermissions = attrWritePerms.get(key);
        if (attrWritePermissions) {
            entry.write = attrWritePermissions;
        }
        if (attrReadPermissions || attrWritePermissions) {
            attrPerms.push(entry);
        }
    }

    return {
        attrPerms,
    };
}

export default exportAttrPermissions;