function prepareUsermanagement(usermanagement) {
    let csUserEntries = [];
    let csUgMembershipEntries = [];

    for (let user of usermanagement) {
        csUserEntries.push([ 
            user.login_name, 
            user.administrator === true, 
            user.pw_hash, 
            user.salt,
            csUserEntries.length + 1,
        ]);
        if (user.groups) {
            for (let group of user.groups) {
                let groupAndDomain = group.split('@');        
                csUgMembershipEntries.push([
                    groupAndDomain[0], 
                    user.login_name, 
                    groupAndDomain[1],
                    csUgMembershipEntries.length + 1,
                ]);
            }
        }
    }
    return { csUserEntries, csUgMembershipEntries };
}

export default prepareUsermanagement;