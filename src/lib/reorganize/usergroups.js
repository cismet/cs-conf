function reorganizeUsergroups(usergroups) {
    for (let usergroup of usergroups) {
        if (usergroup.configurationAttributes) {
            usergroup.configurationAttributes = usergroup.configurationAttributes.sort((a, b) => { 
                let aKey = a.key;
                let bKey = b.key;
                return aKey.localeCompare(bKey);
            });
        }
    }

    usergroups = usergroups.sort((a, b) => {
        let aKey = a.key;
        let bKey = b.key;
        let aSplit = aKey.split('@');
        let bSplit = bKey.split('@');
        console.log(aSplit, bSplit);
        let aGroup = aSplit[0];
        let bGroup = bSplit[0];
        let aDomain = aSplit.length > 1 ? aSplit[1].toUpperCase() : 'LOCAL'
        let bDomain = bSplit.length > 1 ? bSplit[1].toUpperCase() : 'LOCAL'
        return aDomain != 'LOCAL' || aDomain.localeCompare(bDomain) || aGroup.localeCompare(bGroup);
    });
    
    return usergroups;
}

export default reorganizeUsergroups;