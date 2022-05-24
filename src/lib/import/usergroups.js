export function prepareUsergroups(usergroups) {
    let csUgEntries = [];
    let prioCounter = 0;
    for (let ug of usergroups) {
        let keyComponents = ug.key.split('@');        
        let name = keyComponents[0];
        let domain = keyComponents.length == 1 ? 'LOCAL' : keyComponents[1];
        let descr = ug.descr;
        csUgEntries.push([ name, descr, domain, prioCounter ]);
        prioCounter += 10;
    }
    return { csUgEntries };
}

export default prepareUsergroups;