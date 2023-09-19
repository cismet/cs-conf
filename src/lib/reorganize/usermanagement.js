import reorganizeConfigurationAttributes from "./configurationAttributes";

function reorganizeUsermanagement(usermanagement) {
    if (usermanagement != null) {
        for (let user of usermanagement) {
            if (user.configurationAttributes) {
                user.configurationAttributes = reorganizeConfigurationAttributes(user.configurationAttributes);
            }
            if (user.groups) {
                user.groups = user.groups.sort();
            }
        }

        usermanagement = usermanagement.sort((a, b) => {
            let aLoginName = a.login_name;
            let bLobinName = b.login_name;
            return aLoginName.localeCompare(bLobinName);
        });
    }    
    return usermanagement;
}

export default reorganizeUsermanagement;