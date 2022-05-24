export function prepareUsermanagement(usermanagement) {
    let csUserEntries = [];
    let csUserEntriesWithPasswords = [];
    let csUgMembershipEntries = [];

    for (let u of usermanagement) {
        let admin = u.administrator === true;
        if (u.password) {
            csUserEntriesWithPasswords.push([u.login_name, u.password, admin]);
        } else {
            csUserEntries.push([u.login_name, admin, u.pw_hash, u.salt]);
        }
        if (u.groups) {
            for (let ug of u.groups) {
                let groupComponents = ug.split('@');        
                let gName = groupComponents[0];
                let domain = groupComponents.length == 1 ? 'LOCAL' : groupComponents[1];
                csUgMembershipEntries.push([gName, u.login_name, domain]);
            }
        }
    }

    return { csUserEntries, csUserEntriesWithPasswords, csUgMembershipEntries };
}

export default prepareUsermanagement;