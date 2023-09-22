function exportUserManagement({ csUsrs, csUgMemberships }, { userConfigAttrs }) {
    let userGroupMap = new Map();
    for (let csUgMembership of csUgMemberships) {
        let user = userGroupMap.get(csUgMembership.login_name);
        let gkey = csUgMembership.groupname + (csUgMembership.domainname.toUpperCase() == 'LOCAL' ? '' : '@' + csUgMembership.domainname)
        if (user) {
            user.push(gkey);
        } else {
            userGroupMap.set(csUgMembership.login_name, [gkey]);
        }
    }

    let usermanagement = [];

    for (let csUsr of csUsrs) {
        let user = Object.assign({}, csUsr);

        //add the usergroups
        let groups = userGroupMap.get(user.login_name);
        if (groups) {
            user.groups = groups;
        }

        //add the configuration attributes
        let attributes = userConfigAttrs.get(user.login_name);

        if (attributes) {
            user.configurationAttributes = attributes;
        }

        //remove administrator-flag if it is false
        if (user.administrator === false) {
            delete user.administrator;
        }
        usermanagement.push(user);
    }

    return {
        usermanagement
    }

}

export default exportUserManagement;