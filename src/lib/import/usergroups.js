function prepareUsergroups(usergroups) {
    let csUgEntries = [];
    let prioCounter = 0;
    for (let group of usergroups) {
        let groupAndDomain = group.key.split('@');        
        let descr = group.descr;
        csUgEntries.push([ 
            groupAndDomain[0], 
            descr, 
            groupAndDomain[1], 
            prioCounter 
        ]);
        prioCounter += 10;
    }
    return { csUgEntries };
}

export default prepareUsergroups;