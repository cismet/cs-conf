import { extendLocalDomain } from "../tools/cids";
import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultUser as defaultUser } from "../tools/defaultObjects";
import util from 'util';

export function normalizeUsermanagement(usermanagement) {
    let normalized = [];

    if (usermanagement != null) {
        for (let user of usermanagement) {
            normalized.push(normalizeUser(user));
        }
    }

    return normalized;
}

export function normalizeUser(user) {
    if (user.login_name == null) throw "normalizeUsermanagement: missing login_name";
    if (user.pw_hash == null) throw util.format("normalizeUsermanagement: [%s] missing pw_hash", user.login_name);
    if (user.salt == null) throw util.format("normalizeUsermanagement: [%s] missing salt", user.login_name);
    if (user.password != null) throw util.format("normalizeUsermanagement: [%s] password not allowed", user.login_name);

    let normalized = Object.assign({}, defaultUser, user, {
        groups: normalizeGroups(user.groups),
        configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
    })
    return normalized;
}

export function normalizeGroups(groups) {
    let normalized = [];

    if (groups != null) {
        for (let group of groups) {
            normalized.push(normalizeGroup(group));
        }
    }
    return normalized;
}

export function normalizeGroup(group) {
    let normalized = extendLocalDomain(group);
    return normalized;
}

export default normalizeUsermanagement;