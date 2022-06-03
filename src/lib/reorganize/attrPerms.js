import reorganizePerms from "./perms";

function reorganizeAttrPerms(attrPerms) {
    if (attrPerms != null) {
        for (let attrPerm of attrPerms) {
            if (attrPerm.write) {
                attrPerm.write = reorganizePerms(attrPerm.write);
            }
            if (attrPerm.read) {
                attrPerm.read = reorganizePerms(attrPerm.read);
            }
        }

        attrPerms = attrPerms.sort((a, b) => {
            return a.key.toLowerCase().localeCompare(b.key.toLowerCase())
        });
    }
    return attrPerms;
}

export default reorganizeAttrPerms;