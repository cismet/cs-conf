import { extendLocalDomain } from "../tools/cids";
import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultUser as defaultUser } from "../tools/defaultObjects";

function normalizeUsermanagement(usermanagement) {
    let normalized = [];

    if (usermanagement !== undefined) {
        for (let user of usermanagement) {
            if (user.login_name == null) throw "normalizeUsermanagement: missing login_name";
            if (user.pw_hash == null) throw "normalizeUsermanagement: missing pw_hash";
            if (user.salt == null) throw "normalizeUsermanagement: missing salt";
            if (user.password != null) throw "normalizeUsermanagement: password not allowed";

            normalized.push(Object.assign({}, defaultUser, user, {
                groups: normalizeGroups(user.groups),
                configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
            }));
        }
    }

    return normalized;
}

function normalizeGroups(groups) {
    let normalized = [];

    if (groups != null) {
        for (let group of groups) {
            normalized.push(extendLocalDomain(group));
        }
    }

    return normalized;
}

export default normalizeUsermanagement;