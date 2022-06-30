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
            return aGroupAndDomain.domain.localeCompare(bGroupAndDomain.domain) || aGroupAndDomain.group.localeCompare(bGroupAndDomain.group);
        }).sort((a, b) => {
            let aGroupAndDomain = extractGroupAndDomain(extendLocalDomain(a.key));
            let bGroupAndDomain = extractGroupAndDomain(extendLocalDomain(b.key));
            return aGroupAndDomain.domain == 'LOCAL' || aGroupAndDomain.domain.localeCompare(bGroupAndDomain.domain);
        });
    }
    return usergroups;
}

export default reorganizeUsergroups;