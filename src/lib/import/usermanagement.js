import { extractGroupAndDomain } from "../tools/cids";

function prepareUsermanagement({ usermanagement, configurationAttributes, additionalInfos }) {
    let csUserEntries = [];
    let csUgMembershipEntries = [];

    for (let user of usermanagement) {
        let userKey = user.login_name;
        csUserEntries.push([ 
            userKey, 
            user.pw_hash, 
            user.salt,
            user.last_pwd_change,
            csUserEntries.length + 1,
        ]);
        if (user.groups) {
            for (let group of user.groups) {
                let groupAndDomain = group.split('@');        
                let groupName = groupAndDomain[0];
                let domainKey = groupAndDomain[1];
                csUgMembershipEntries.push([
                    groupName, 
                    userKey, 
                    domainKey,
                    csUgMembershipEntries.length + 1,
                ]);
            }
        }

        if (user.configurationAttributes) {
            for (let configurationAttribute of user.configurationAttributes) {
                if (configurationAttribute.groups != null && configurationAttribute.groups.length > 0) {
                    for (let group of configurationAttribute.groups) {
                        let groupAndDomain = extractGroupAndDomain(group);   
                        let groupKey = groupAndDomain != null ? groupAndDomain.group : null;
                        let domainKey = groupAndDomain != null ? groupAndDomain.domain : 'LOCAL';
                        configurationAttributes.push(Object.assign({}, configurationAttribute, {
                            user: userKey,
                            group: groupKey,
                            domain: domainKey,
                        }));
                    }
                } else {
                    configurationAttribute.user = userKey;
                    configurationAttributes.push(Object.assign({}, configurationAttribute, {
                        user: userKey,
                        domain: 'LOCAL',
                    }));
                }
            }
        }
    }
    return { csUserEntries, csUgMembershipEntries };
}

export default prepareUsermanagement;