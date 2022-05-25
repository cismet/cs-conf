function reorganizeAttrPerms(attrPerms) {
    for (let attrPerm of attrPerms) {
        if (attrPerm.write) {
            attrPerm.write = attrPerm.write.sort();
        }
        if (attrPerm.read) {
            attrPerm.read = attrPerm.read.sort();
        }
    }

    attrPerms = attrPerms.sort((a, b) => {
        return a.key.toLowerCase().localeCompare(b.key.toLowerCase())
    });
    
    return attrPerms;
}

export default reorganizeAttrPerms;