function exportUserManagement({ csUsrs, csUgMemberships }, { additionalInfos, userConfigAttrs }) {
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

    let additionalInfosUser = additionalInfos.user ?? {};

    for (let csUsr of csUsrs) {
        let user = Object.assign({}, csUsr);
        let userKey = user.login_name;        

        //add the usergroups
        let groups = userGroupMap.get(userKey);
        if (groups) {
            user.groups = groups;
        }

        //add the configuration attributes
        let attributes = userConfigAttrs.get(userKey);
        if (attributes) {
            user.configurationAttributes = attributes;
        }

        //add the additionalInfo
        user.additional_info = additionalInfosUser[userKey];
        delete additionalInfosUser[userKey];        

        usermanagement.push(user);
    }

    return {
        usermanagement
    }

}

export default exportUserManagement;