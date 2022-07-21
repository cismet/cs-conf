import * as stmnts from './statements';

async function exportUserManagement(client, groupConfigAttrs, userConfigAttrs) {
    let {
        rows: groupArray
    } = await client.query(stmnts.usergroups);
    let {
        rows: userArray
    } = await client.query(stmnts.users);
    let {
        rows: membership
    } = await client.query(stmnts.usergroupmembership);

    let processed = analyzeAndPreprocess(groupArray, userArray, membership, groupConfigAttrs, userConfigAttrs);
    return processed;
}

function analyzeAndPreprocess(groupArray, usermanagement, membership, groupConfigAttrs, userConfigAttrs) {
    let usergroups = [];
    for (let group of groupArray) {
        let g = {
            key: group.name + (group.domain.toUpperCase() == 'LOCAL' ? '' : '@' + group.domain)
        };
        if (group.descr){
            g.descr=group.descr;
        }
        let attributes = groupConfigAttrs.get(group.name + '@' + group.domain);
        if (attributes) {
            g.configurationAttributes = attributes;
        }
        usergroups.push(g);
    }
    // Users

    let userGroupMap = new Map();
    for (let entry of membership) {
        let user = userGroupMap.get(entry.login_name);
        let gkey = entry.groupname + (entry.domainname.toUpperCase() == 'LOCAL' ? '' : '@' + entry.domainname)
        if (user) {
            user.push(gkey);
        } else {
            userGroupMap.set(entry.login_name, [gkey]);
        }
    }

    //now change the original user store
    // Usermanagement -----------------------------------------------------------------------
    for (let user of usermanagement) {
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

        // remove the last_pwd_change
        delete user.last_pwd_change;

    }
    return {
        usermanagement,
        usergroups
    }

}

export default exportUserManagement;