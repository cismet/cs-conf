import { extendLocalDomain, extractGroupAndDomain } from "../tools/cids";
import reorganizeConfigurationAttributes from "./configurationAttributes";

function reorganizeUsergroups(usergroups) {
    if (usergroups != null) {
        for (let usergroup of usergroups) {
            if (usergroup.configurationAttributes) {
                usergroup.configurationAttributes = reorganizeConfigurationAttributes(usergroup.configurationAttributes);
            }
        }

        usergroups = usergroups.sort((a, b) => {
            let aGroupAndDomain = extractGroupAndDomain(extendLocalDomain(a.key));
            let bGroupAndDomain = extractGroupAndDomain(extendLocalDomain(b.key));
            let aDomain = aGroupAndDomain.domain != 'LOCAL' ? aGroupAndDomain.domain : ''
            let bDomain = bGroupAndDomain.domain != 'LOCAL' ? bGroupAndDomain.domain : ''
            return aDomain.localeCompare(bDomain) || aGroupAndDomain.group.localeCompare(bGroupAndDomain.group);
        });
    }
    return usergroups;
}

export default reorganizeUsergroups;