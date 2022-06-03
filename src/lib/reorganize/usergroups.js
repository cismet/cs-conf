import reorganizeConfigurationAttributes from "./configurationAttributes";

function reorganizeUsergroups(usergroups) {
    if (usergroups != null) {
        for (let usergroup of usergroups) {
            if (usergroup.configurationAttributes) {
                usergroup.configurationAttributes = reorganizeConfigurationAttributes(usergroup.configurationAttributes);
            }
        }

        usergroups = usergroups.sort((a, b) => {
            let aKey = a.key;
            let bKey = b.key;
            let aSplit = aKey.split('@');
            let bSplit = bKey.split('@');
            let aGroup = aSplit[0];
            let bGroup = bSplit[0];
            let aDomain = aSplit[1];
            let bDomain = bSplit[1];
            return aDomain != 'LOCAL' || aDomain.localeCompare(bDomain) || aGroup.localeCompare(bGroup);
        });
    }
    return usergroups;
}

export default reorganizeUsergroups;