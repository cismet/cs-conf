function prepareUsermanagement(usermanagement) {
    let csUserEntries = [];
    let csUgMembershipEntries = [];

    for (let u of usermanagement) {
        let admin = u.administrator === true;
        csUserEntries.push([u.login_name, admin, u.pw_hash, u.salt]);
        if (u.groups) {
            for (let ug of u.groups) {
                let groupComponents = ug.split('@');        
                let gName = groupComponents[0];
                let domain = groupComponents.length == 1 ? 'LOCAL' : groupComponents[1];
                csUgMembershipEntries.push([gName, u.login_name, domain]);
            }
        }
    }

    return { csUserEntries, csUgMembershipEntries };
}

export default prepareUsermanagement;