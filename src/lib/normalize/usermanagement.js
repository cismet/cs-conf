import { extendLocalDomain } from "../tools/cids";
import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultUser as defaultUser } from "../tools/defaultObjects";
import util from 'util';
import { topologicalSort } from "../tools/tools";


export function normalizeUsermanagement(usermanagement) {
    let normalized = [];

    let usersMap = new Map();
    
    for (let user of usermanagement) {
        if (user != null) {
            let userKey = user.login_name;
            if (userKey == null) throw "normalizeUsermanagement: missing login_name";

            let normalizedUser = normalizeUser(user);
            usersMap.set(userKey, normalizedUser);
            normalized.push(normalizedUser);
        }
    }

    let shadowDependencyGraph = normalized.reduce((graphed, user) => (graphed[user.login_name] = user.shadows, graphed), {});           
    let dependencySortedUsers = topologicalSort(shadowDependencyGraph);

    for (let userKey of dependencySortedUsers) {
        unshadow(userKey, usersMap);        
    }

    return normalized;
}

function unshadow(userKey, usersMap) {      
    let user = usersMap.get(userKey);
    if (user != null && user.shadows != null) {
        let shadows = user.shadows;
        if (shadows.length > 0) {
            if (!user.additional_info._unshadowed_groups) {
                user.additional_info._unshadowed_groups = user.groups;
                for (let shadowKey of [...shadows].reverse()) {
                    let shadow = usersMap.get(shadowKey);
                    if (shadow != null) {
                        if (shadow.groups != null) {
                            user.groups = [...new Set([...shadow.groups, ...user.groups])];
                        }
                    }
                }            
            }
            if (!user.additional_info._unshadowed_configurationAttributes) {
                for (let shadowKey of shadows) {
                    user.additional_info._unshadowed_configurationAttributes = user.configurationAttributes;
                    let shadow = usersMap.get(shadowKey);
                    if (shadow != null) {
                        if (shadow.configurationAttributes != null) {
                            user.configurationAttributes = [...new Set([...shadow.configurationAttributes, ...user.configurationAttributes])];
                        }
                    }
                }
            }            
        }
    }
}

export function normalizeUser(user) {
    if (user.pw_hash == null) throw util.format("normalizeUsermanagement: [%s] missing pw_hash", user.login_name);
    if (user.salt == null) throw util.format("normalizeUsermanagement: [%s] missing salt", user.login_name);
    if (user.password != null) throw util.format("normalizeUsermanagement: [%s] password not allowed", user.login_name);

    let normalized = Object.assign({}, defaultUser, user, {
        groups: normalizeGroups(user.groups),
        configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
        additional_info: user.additional_info ?? {},
    });

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