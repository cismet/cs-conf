import util from "util";
import stringify from "json-stringify-pretty-compact";

import { readConfigFiles, writeFile } from "./tools/configFiles";
import { logOut } from "./tools/tools";
import { completeConfigAttr, extendLocalDomain, extractGroupAndDomain } from "./tools/cids";
import { normalizeConfigs } from "./normalize";

import { simplifyUser, simplifyUsergroup, simplifyDomain, simplifyUsermanagement, simplifyUsergroups, simplifyDomains } from "./simplify";
import { reorganizeUser, reorganizeUsergroup, reorganizeDomain, reorganizeDomains, reorganizeUsergroups, reorganizeUsermanagement } from "./reorganize";
import { unshadowUserManagement } from "./import";

export default async function csInspect({ userKey, groupKey, domainKey, aggregateConfAttrValues = false, fileTarget }) {
    let configs = readConfigFiles(global.configsDir);
    let normalizedConfigs = normalizeConfigs(configs);

    if (configs == null) throw Error("config not set");

    let keys = [];
    if (userKey) keys.push(userKey)
    if (groupKey) keys.push(groupKey)
    if (domainKey) keys.push(domainKey)

    if (keys.length == 0) {
        throw Error("at least one key is necessary")
    } else if (keys.length > 1) {
        throw Error("unambiguous parameters: only one key is allowed.")
    }

    let result = null;
    if (userKey) {
        if (userKey == '*') {
            normalizedConfigs.usermanagement = unshadowUserManagement(normalizedConfigs.usermanagement);
            let inspectedUsermanagement = inspectUsermanagement(normalizedConfigs, aggregateConfAttrValues);
            let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
            let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, { removeShadowInfo: false });
            result = simplifiedUsermanamgement;
        } else {
            normalizedConfigs.usermanagement = unshadowUserManagement(normalizedConfigs.usermanagement);
            let inspectedUser = inspectUser(userKey, normalizedConfigs, aggregateConfAttrValues);
            let reorganizedUser = reorganizeUser(inspectedUser);
            let simplifiedUser = simplifyUser(reorganizedUser, { normalize: false, removeShadowInfo: false })
            result = simplifiedUser;
        }
    } else if (groupKey) {
        if (groupKey == '*') {
            let inspectedUsergroups = inspectUsergroups(normalizedConfigs, aggregateConfAttrValues);
            let reorganizedUsergroups = reorganizeUsergroups(inspectedUsergroups);
            let simplifiedUsergroups = simplifyUsergroups(reorganizedUsergroups);
            result = simplifiedUsergroups;
        } else {
            let normalizedGroupKey = extendLocalDomain(groupKey);
            let inspectedGroup = inspectUsergroup(normalizedGroupKey, normalizedConfigs, aggregateConfAttrValues);
            let reorganizedGroup = reorganizeUsergroup(inspectedGroup);
            let simplifiedGroup = simplifyUsergroup(reorganizedGroup);
            result = simplifiedGroup;
        }
    } else if (domainKey) {
        if (domainKey == '*') {
            let inspectedDomains = inspectDomains(normalizedConfigs, aggregateConfAttrValues);
            let reorganizedDomains = reorganizeDomains(inspectedDomains);
            let simplifiedDomains = simplifyDomains(reorganizedDomains);
            result = simplifiedDomains;
        } else {
            let inspectedDomain = inspectDomain(domainKey, normalizedConfigs, aggregateConfAttrValues);
            let reorganizedDomain = reorganizeDomain(inspectedDomain);
            let simplifiedDomain = simplifyDomain(reorganizedDomain);            
            result = simplifiedDomain;
        }
    }
    if (fileTarget) {
        writeFile(stringify(result), fileTarget, {verboseOnly: false});
    } else {
        logOut(stringify(result), { noSilent: true })
    }
}

// ---

export function inspectUsermanagement(configs, aggregateConfAttrValues = false) {
    let inspected = {};
    
    let { usermanagement } = configs;
    for (let userKey of Object.keys(usermanagement)) {
        inspected[userKey] = inspectUser(userKey, configs, aggregateConfAttrValues);
    }

    return inspected;
}

export function inspectUser(userKey, {usermanagement, usergroups, domains, classes}, aggregateConfAttrValues = false) {
    if (!userKey) throw Error(util.format("userKey is missing"));

    let user = usermanagement[userKey];
    if (!user) throw Error(util.format("user '%s' not found", userKey));

    let domainKeys = new Set();
    let groupKeysSet = new Set();
    for (let groupKey of user.groups.sort((a, b) => {
        if (a.prio === null && b.prio === null) return 0;
        if (a.prio === null) return 1;
        if (b.prio === null) return -1;
        return a.prio - b.prio;
      })) {
        let groupAndDomain = extractGroupAndDomain(groupKey);
        let domainKey = groupAndDomain.domain;
        domainKeys.add(domainKey);
        groupKeysSet.add(groupKey);

        if (!usergroups[groupKey]) throw Error(util.format("usergroup '%s' of user '%s' not found", groupKey, userKey));
    }

    let configurationAttributes = Object.assign({}, user.configurationAttributes);

    for (let groupKey of groupKeysSet) {
        let group = usergroups[groupKey];
        let groupConfigurationAttributes = group.configurationAttributes;
        let completition = {_group: groupKey};
        completeConfigAttr(configurationAttributes, groupConfigurationAttributes, userKey, completition, aggregateConfAttrValues);
    }

    for (let domainKey of domainKeys) {            
        let domain = domains[domainKey];
        let domainConfigurationAttributes = domain.configurationAttributes;
        let completition = {_domain: domainKey};
        completeConfigAttr(configurationAttributes, domainConfigurationAttributes, userKey, completition, aggregateConfAttrValues);
    }

    let inspected = Object.assign({}, user, { configurationAttributes }, permsForGroups([...groupKeysSet], classes));
    return inspected;
}

// ---

export function inspectUsergroups(configs, aggregateConfAttrValues = false) {
    let inspected = {};
    
    let { usergroups } = configs;
    for (let groupKey of Object.keys(usergroups)) {
        inspected[groupKey] = inspectUsergroup(groupKey, configs, aggregateConfAttrValues);
    }

    return inspected;
}

export function inspectUsergroup(groupKey, { usermanagement, usergroups, domains, classes }, aggregateConfAttrValues = false) {
    if (!groupKey) throw Error(util.format("groupKey is missing"));

    let group = usergroups[groupKey];
    if (!group) throw Error(util.format("group '%s' not found", groupKey));

    let groupAndDomainKeys = extractGroupAndDomain(groupKey);
    let domainKey = groupAndDomainKeys.domain;

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' of usergroup '%s' not found", domainKey, groupKey));

    let configurationAttributes = Object.assign({}, group.configurationAttributes);
    completeConfigAttr(configurationAttributes, domain.configurationAttributes, groupKey, {_domain: domainKey}, aggregateConfAttrValues);

    let userKeySet = new Set();
    for (let userKey of Object.keys(usermanagement)) {
        let user = usermanagement[userKey];
        if (user.groups.includes(groupKey)) {
            userKeySet.add(userKey);
        }
    }
    let members = [...userKeySet];

    let inspected = Object.assign({}, group, { 
        configurationAttributes: configurationAttributes,
        members,
    }, permsForGroup(groupKey, classes));
    return inspected;
}

// ---

export function inspectDomains(configs, aggregateConfAttrValues = false) {
    let inspected = {};
    
    let { domains } = configs;
    for (let domainKey of Object.keys(domains)) {
        inspected[domainKey] = inspectDomain(domainKey, configs, aggregateConfAttrValues);
    }

    return inspected;
}

export function inspectDomain(domainKey, { domains }, aggregateConfAttrValues = false) {
    if (!domainKey) throw Error(util.format("domainKey is missing"));

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' not found", domainKey));

    let inspected = Object.assign({}, domain);
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

    let readPermClasses = readPermClassesSet.size > 0 ? [...readPermClassesSet] : [];
    let writePermClasses = writePermClassesSet.size > 0 ? [...writePermClassesSet] : [];
    let readPermAttributes = readPermAttributesSet.size > 0 ? [...readPermAttributesSet] : [];
    let writePermAttributes = writePermAttributesSet.size > 0 ? [...writePermClassesSet] : [];

    return {
        readPermClasses,
        writePermClasses,
        readPermAttributes,
        writePermAttributes,
    };
}