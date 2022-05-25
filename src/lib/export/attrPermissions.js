import * as stmnts from './statements';
import util from 'util';

async function exportAttrPermissions(client, attributes, classReadPerms, classWritePerms, reorganize = false) {
    const {
        rows: attrPermResult
    } = await client.query(reorganize ? stmnts.attributePermissionsByKey : stmnts.attributePermissionsById);

    return analyzeAndPreprocess(attrPermResult, attributes, classReadPerms, classWritePerms);
}

function analyzeAndPreprocess(attrPermResult, attributes, classReadPerms, classWritePerms) {
    let attrReadPerms = new Map();
    let attrWritePerms = new Map();

    for (let ap of attrPermResult) {
        let ug = util.format("%s@%s", ap.group, ap.domain);
        let key = util.format("%s.%s", ap.table, ap.field);
        let attrReadPermissions = attrReadPerms.get(key);
        if (ap.permission === "read") {
            if (!attrReadPermissions) {
                attrReadPermissions = [];
                attrReadPerms.set(key, attrReadPermissions);
            }
            attrReadPermissions.push(ug);
        } else if (ap.permission === "write") {
            let attrWritePermissions = attrWritePerms.get(key);
            if (!attrWritePermissions) {
                attrWritePermissions = [];
                attrWritePerms.set(key, attrWritePermissions);
            }
            attrWritePermissions.push(ug);
        }
    }
    let attrPerms = [];
    let normalizedAPerms = new Map();
    for (let a of attributes) {
        let key = util.format("%s.%s", a.table, a.field);
        let attrReadPermissions = classReadPerms.get(key);
        let attrWritePermissions = classWritePerms.get(key);
        let entry = {
            attribute: key
        }
        let normKey = "";
        if (attrReadPermissions) {
            entry.read = attrReadPermissions.sort();
            normKey += util.format("read:::%s", JSON.stringify(entry.read));
        }
        if (attrWritePermissions) {
            entry.write = attrWritePermissions.sort();
            normKey += util.format("write:::%s", JSON.stringify(entry.write));
        }
        if (attrReadPermissions || attrWritePermissions) {
            let attrsForPermissions = normalizedAPerms.get(normKey);
            if (!attrsForPermissions) {
                attrsForPermissions = [];
                normalizedAPerms.set(normKey, attrsForPermissions);
            }
            attrsForPermissions.push(t);
            attrPerms.push(entry);
        }
    }

    /*let normalizedAttrPerms = [];
    //normalized Permissions 
    normalizedAPerms.forEach((attributes) => {
        let entry = {
            attributes
        }
        let rp = attrReadPerms.get(attributes[0]);
        let wp = attrWritePerms.get(attributes[0]);
        if (rp) {
            entry.read = rp;
        }
        if (wp) {
            entry.write = wp;
        }
        normalizedAttrPerms.push(entry);
    });*/
    

    return {
        attrPerms,
        //normalizedAttrPerms
    };
}

export default exportAttrPermissions;