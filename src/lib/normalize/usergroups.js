import { extendLocalDomain } from "../tools/cids";
import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultUserGroup } from "./_defaultObjects";

function normalizeUsergroups(usergroups) {
    let normalized = [];

    if (usergroups !== undefined) {
        for (let usergroup of usergroups) {
            if (usergroup.key == null) throw "missing key";

            normalized.push(Object.assign({}, defaultUserGroup, usergroup, {
                key: extendLocalDomain(usergroup.key),
                configurationAttributes: normalizeConfigurationAttributes(usergroup.configurationAttributes),
            }));
        }
    }

    return normalized;
}

export default normalizeUsergroups;