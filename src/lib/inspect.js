import util from "util";
import stringify from "json-stringify-pretty-compact";

import { readConfigFiles, writeFile } from "./tools/configFiles";
import { logOut, logWarn } from "./tools/tools";
import { completeConfigAttr, extendLocalDomain, extractGroupAndDomain } from "./tools/cids";
import { normalizeConfigs } from "./normalize";

import { simplifyUsermanagement, simplifyUsergroups, simplifyDomains, simplifyConfigurationAttributes } from "./simplify";
import { reorganizeUsermanagement, reorganizeUsergroups, reorganizeDomains, reorganizeConfigurationAttributes } from "./reorganize";
import { unshadowUsermanagement } from "./import";
import slug from "slug";

export default async function csInspect({ configurationAttributeKey, domainKey, groupKey, userKey, aggregateConfigurationAttributeValues = false, print = false, fileTarget }) {
    let configs = readConfigFiles(global.configsDir);
    let normalizedConfigs = normalizeConfigs(configs);

    if (configs == null) throw Error("config not set");

    let type = undefined;
    let keys = [];
    if (configurationAttributeKey) { type = 'configurationAttribute'; keys.push(configurationAttributeKey); }
    if (domainKey) { type = 'domain'; keys.push(domainKey); }
    if (groupKey) { type = 'group'; keys.push(groupKey); }
    if (userKey) { type = 'user'; keys.push(userKey); }

    if (keys.length == 0) {
        throw Error("at least one key is necessary")
    } else if (keys.length > 1) {
        throw Error("unambiguous parameters: only one key is allowed.")
    }

    let key = keys.shift();

    let result = null;
    switch (type) {
        case "user": {
            if (userKey == '*') {
                let inspectedUsermanagement = inspectUsermanagement(normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement), { aggregateConfigurationAttributeValues });
                let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
                let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, { removeShadowInfo: false });
                result = simplifiedUsermanamgement;
            } else {
                let inspectedUsermanagement = inspectUser(userKey, normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement), { aggregateConfigurationAttributeValues });
                let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
                let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, { normalize: false, removeShadowInfo: false })
                result = simplifiedUsermanamgement;
            }    
        } break;
        case "group": {
            if (groupKey == '*') {
                let inspectedUsergroups = inspectUsergroups(normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement), { aggregateConfigurationAttributeValues });
                let reorganizedUsergroups = reorganizeUsergroups(inspectedUsergroups);
                let simplifiedUsergroups = simplifyUsergroups(reorganizedUsergroups);
                result = simplifiedUsergroups;
            } else {
                let normalizedGroupKey = extendLocalDomain(groupKey);
                let inspectedGroups = inspectUsergroup(normalizedGroupKey, normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement), { aggregateConfigurationAttributeValues });
                let reorganizedGroups = reorganizeUsergroups(inspectedGroups);
                let simplifiedGroups = simplifyUsergroups(reorganizedGroups);
                result = simplifiedGroups;
            }
            } break;
        case "domain": {
            if (domainKey == '*') {
                let inspectedDomains = inspectDomains(normalizedConfigs);
                let reorganizedDomains = reorganizeDomains(inspectedDomains);
                let simplifiedDomains = simplifyDomains(reorganizedDomains);
                result = simplifiedDomains;
            } else {
                let inspectedDomains = inspectDomain(domainKey, normalizedConfigs);
                let reorganizedDomains = reorganizeDomains(inspectedDomains);
                let simplifiedDomains = simplifyDomains(reorganizedDomains);            
                result = simplifiedDomains;
            }
        } break;
        case "configurationAttribute": {
            if (configurationAttributeKey == '*') {
                let inspectedConfigurationAttributes = inspectConfigurationAttributes(normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement));
                let reorganizedConfigurationAttributes = reorganizeConfigurationAttributes(inspectedConfigurationAttributes);
                let simplifiedConfigurationAttributes = simplifyConfigurationAttributes(reorganizedConfigurationAttributes);
                result = simplifiedConfigurationAttributes;
            } else {
                let inspectedConfigurationAttributes = inspectConfigurationAttribute(configurationAttributeKey, normalizedConfigs, unshadowUsermanagement(normalizedConfigs.usermanagement));
                let reorganizedConfigurationAttributes = reorganizeConfigurationAttributes(inspectedConfigurationAttributes);
                let simplifiedConfigurationAttributes = simplifyConfigurationAttributes(reorganizedConfigurationAttributes);            
                result = simplifiedConfigurationAttributes;
            }
        } break;
    }
    if (print) {
        logOut(stringify(result), { noSilent: true })
    } else {
        let outputFile = util.format(fileTarget, type, slug(key));
        writeFile(stringify(result), outputFile, {verboseOnly: false});
    }
}

// ---

export function inspectConfigurationAttributes(configs, unshadowedUsermanagement) {
    let inspected = {};
    
    let { configurationAttributes } = configs;
    for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
        Object.assign(inspected, inspectConfigurationAttribute(configurationAttributeKey, configs, unshadowedUsermanagement));
    }

    return inspected;
}

export function inspectConfigurationAttribute(configurationAttributeKey, {configurationAttributes, usergroups, domains}, unshadowedUsermanagement) {
    if (!configurationAttributeKey) throw Error(util.format("configurationAttributeKey is missing"));

    let configurationAttribute = configurationAttributes[configurationAttributeKey];
    if (!configurationAttribute) throw Error(util.format("configurationAttribute '%s' not found", configurationAttributeKey));

    let foundAny = false;
    let domainValues = {};
    for (let [ domainKey, domain ] of Object.entries(domains)) {
        if (domain && domain.configurationAttributes && domain.configurationAttributes[configurationAttributeKey]) {
            domainValues[domainKey] = domain.configurationAttributes[configurationAttributeKey];
            foundAny = true;
        }
    }

    let groupValues = {};
    for (let [ groupKey, group ] of Object.entries(usergroups)) {
        if (group && group.configurationAttributes && group.configurationAttributes[configurationAttributeKey]) {
            groupValues[groupKey] = group.configurationAttributes[configurationAttributeKey];
            foundAny = true;
        }
    }

    let userValues = {};
    for (let [ userKey, user ] of Object.entries(unshadowedUsermanagement)) {
        if (user && user.configurationAttributes && user.configurationAttributes[configurationAttributeKey]) {
            userValues[userKey] = user.configurationAttributes[configurationAttributeKey];
            foundAny = true;
        }
    }

    let inspectedConfigurationAttribute = Object.assign({
        domainValues,
        groupValues,
        userValues,
    });

    if (!foundAny) {
        logWarn(util.format("configurationAttribute '%s' is not used anywhere.", configurationAttributeKey));
    }

    let inspected = {};
    inspected[configurationAttributeKey] = Object.assign({}, configurationAttribute, { inspected: inspectedConfigurationAttribute });

    return inspected;

}

export function inspectUsermanagement(configs, unshadowedUsermanagement, { aggregateConfigurationAttributeValues = false } = {}) {
    let inspected = {};
    
    let { usermanagement } = configs;
    for (let userKey of Object.keys(usermanagement)) {
        Object.assign(inspected, inspectUser(userKey, configs, unshadowedUsermanagement, { aggregateConfigurationAttributeValues }));
    }

    return inspected;
}

export function inspectUser(userKey, {usermanagement, usergroups, domains, classes}, unshadowedUsermanagement, { aggregateConfigurationAttributeValues = false } = {}) {
    if (!userKey) throw Error(util.format("userKey is missing"));

    let user = usermanagement[userKey];
    if (!user) throw Error(util.format("user '%s' not found", userKey));

    let unshadowedUser = unshadowedUsermanagement[userKey];

    let domainKeySet = new Set();
    let groupKeySet = new Set();
    for (let groupKey of unshadowedUser.groups.sort((a, b) => {
        if (a.prio === null && b.prio === null) return 0;
        if (a.prio === null) return 1;
        if (b.prio === null) return -1;
        return a.prio - b.prio;
      })) {
        let groupAndDomain = extractGroupAndDomain(groupKey);
        let domainKey = groupAndDomain.domain;
        domainKeySet.add(domainKey);
        groupKeySet.add(groupKey);

        if (!usergroups[groupKey]) throw Error(util.format("usergroup '%s' of user '%s' not found", groupKey, userKey));
    }

    let allConfigurationAttributes = Object.assign({}, unshadowedUser.configurationAttributes);    
    for (let groupKey of groupKeySet) {
        let group = usergroups[groupKey];
        let groupConfigurationAttributes = group.configurationAttributes;
        let completition = {group: groupKey};
        completeConfigAttr(allConfigurationAttributes, groupConfigurationAttributes, userKey, completition, aggregateConfigurationAttributeValues);
    }
    for (let domainKey of domainKeySet) {            
        let domain = domains[domainKey];
        let domainConfigurationAttributes = domain.configurationAttributes;
        let completition = {domain: domainKey};
        completeConfigAttr(allConfigurationAttributes, domainConfigurationAttributes, userKey, completition, aggregateConfigurationAttributeValues);
    }

    let shadowMemberOf = {};
    if (user.shadows) {
        for (let shadowKey of user.shadows) {
            shadowMemberOf[shadowKey] = unshadowedUsermanagement[shadowKey].groups;
        }
    }

    let memberOf = [...groupKeySet];

    let inspectedUser = Object.assign({
        memberOf,
        shadowMemberOf,
        allConfigurationAttributes,
    }, permsForGroups([...groupKeySet], classes));

    let inspected = {};
    inspected[userKey] = Object.assign({}, user, { inspected: inspectedUser });

    return inspected;
}

// ---

export function inspectUsergroups(configs, unshadowedUsermanagement, { aggregateConfigurationAttributeValues = false } = {}) {
    let inspected = {};
    
    let { usergroups } = configs;
    for (let groupKey of Object.keys(usergroups)) {
        Object.assign(inspected, inspectUsergroup(groupKey, configs, unshadowedUsermanagement, { aggregateConfigurationAttributeValues }));
    }

    return inspected;
}

export function inspectUsergroup(groupKey, { usergroups, domains, classes }, unshadowedUsermanagement, { aggregateConfigurationAttributeValues = false } = {}) {
    if (!groupKey) throw Error(util.format("groupKey is missing"));

    let group = usergroups[groupKey];
    if (!group) throw Error(util.format("group '%s' not found", groupKey));

    let groupAndDomainKeys = extractGroupAndDomain(groupKey);
    let domainKey = groupAndDomainKeys.domain;

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' of usergroup '%s' not found", domainKey, groupKey));

    let allConfigurationAttributes = Object.assign({}, group.configurationAttributes);
    let completition = {domain: domainKey};
    completeConfigAttr(allConfigurationAttributes, domain.configurationAttributes, groupKey, completition, aggregateConfigurationAttributeValues);

    let userKeySet = new Set();
    for (let userKey of Object.keys(unshadowedUsermanagement)) {
        let user = unshadowedUsermanagement[userKey];
        if (user.groups && user.groups.includes(groupKey)) {
            userKeySet.add(userKey);
        }
    }
    let members = [...userKeySet];

    let inspectedGroup = Object.assign({ 
        members,
        allConfigurationAttributes,
    }, permsForGroup(groupKey, classes));

    let inspected = {};
    inspected[groupKey] = Object.assign({}, group, { inspected: inspectedGroup });

    return inspected;
}

// ---

export function inspectDomains(configs) {
    let inspected = {};
    
    let { domains } = configs;
    for (let domainKey of Object.keys(domains)) {
        Object.assign(inspected, inspectDomain(domainKey, configs));
    }

    return inspected;
}

export function inspectDomain(domainKey, { domains, usergroups }) {
    if (!domainKey) throw Error(util.format("domainKey is missing"));

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' not found", domainKey));

    let groupKeySet = new Set();
    for (let groupKey of Object.keys(usergroups)) {
        let groupAndDomain = extractGroupAndDomain(groupKey);
        if (domainKey == groupAndDomain.domain) {
            groupKeySet.add(groupAndDomain.group);
        }
    }

    let groups = [...groupKeySet];

    let inspectedDomain = Object.assign({
        groups,
    });

    let inspected = {};
    inspected[domainKey] = Object.assign({}, domain, { inspected: inspectedDomain });

    return inspected;
}

// ---

function permsForGroup(groupKey, classes) {
    return permsForGroups([groupKey], classes);
}

function permsForGroups(groupKeys, classes) {
    let readPermClassesSet = new Set();
    let writePermClassesSet = new Set();
    let readPermAttributesSet = new Set();
    let writePermAttributesSet = new Set();

    for (let classKey of Object.keys(classes)) {
        let clazz = classes[classKey];
        if (clazz) {
            let classPolicy = clazz.policy;
            // TODO inspect server policy for automatic interpretation
            let classFullKey = classPolicy ? util.format("%s [%s]", classKey, classPolicy) : util.format("%s", classKey);
            if (clazz.readPerms) {
                for (let perm of clazz.readPerms) {
                    if (groupKeys.includes(perm)) {
                        readPermClassesSet.add(classFullKey);
                    }
                }
            }
            if (clazz.writePerms) {
                for (let perm of clazz.writePerms) {
                    if (groupKeys.includes(perm)) {
                        writePermClassesSet.add(classFullKey);
                    }
                }
            }
            let attributes = clazz.attributes;
            // TODO inspect server policy for automatic interpretation
            if (attributes) {
                let attributePolicy = clazz.attribute_policy
                for (let attributeKey of Object.keys(attributes)) {
                    let attribute = attributes[attributeKey];
                    if (attribute) {
                        let fullAttributeKey = attributePolicy ? util.format("%s.%s [%s]", classKey, attributeKey, attributePolicy) : util.format("%s.%s", classKey, attributeKey);
                        for (let perm of attribute.writePerms) {
                            if (groupKeys.includes(perm)) {
                                readPermAttributesSet.add(fullAttributeKey);
                            }
                        }
                        for (let perm of attribute.writePerms) {
                            if (groupKeys.includes(perm)) {
                                writePermAttributesSet.add(fullAttributeKey);
                            }
                        }
                    }
                }
            }
        }
    }

    let canReadClasses = readPermClassesSet.size > 0 ? [...readPermClassesSet] : [];
    let canWriteClasses = writePermClassesSet.size > 0 ? [...writePermClassesSet] : [];
    let canReadAttributes = readPermAttributesSet.size > 0 ? [...readPermAttributesSet] : [];
    let canWriteAttributes = writePermAttributesSet.size > 0 ? [...writePermClassesSet] : [];

    return {
        canReadClasses,
        canWriteClasses,
        canReadAttributes,
        canWriteAttributes,
    };
}