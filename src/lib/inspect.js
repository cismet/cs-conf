import util from "util";
import stringify from "json-stringify-pretty-compact";

import { readConfigFiles, writeFile } from "./tools/configFiles";
import { logDebug, logOut } from "./tools/tools";
import { extractGroupAndDomain } from "./tools/cids";
import { normalizeConfigs } from "./normalize";

import { simplifyUser, simplifyUsergroup, simplifyDomain, simplifyUsermanagement, simplifyUsergroups, simplifyDomains } from "./simplify";
import { reorganizeUser, reorganizeUsergroup, reorganizeDomain, reorganizeDomains, reorganizeUsergroups, reorganizeUsermanagement } from "./reorganize";

export default async function csInspect({ userKey, groupKey, domainKey, aggregateConfAttrValues = false, fileTarget }) {
    let configs = readConfigFiles(global.configsDir);
    let normalizedConfigs = normalizeConfigs(configs);
    let mainDomain = normalizedConfigs.domainName;

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
            let inspectedUsermanagement = inspectUsermanagement(normalizedConfigs, aggregateConfAttrValues);
            let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
            let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, mainDomain);
            result = simplifiedUsermanamgement;
        } else {
            let inspectedUser = inspectUser(userKey, normalizedConfigs, aggregateConfAttrValues);
            let reorganizedUser = reorganizeUser(inspectedUser);
            let simplifiedUser = simplifyUser(reorganizedUser, mainDomain)
            result = simplifiedUser;
        }
    } else if (groupKey) {
        if (groupKey == '*') {
            let inspectedUsergroups = inspectUsergroups(normalizedConfigs);
            let reorganizedUsergroups = reorganizeUsergroups(inspectedUsergroups);
            let simplifiedUsergroups = simplifyUsergroups(reorganizedUsergroups, mainDomain);
            result = simplifiedUsergroups;
        } else {
            let inspectedGroup = inspectUsergroup(groupKey, normalizedConfigs);
            let reorganizedGroup = reorganizeUsergroup(inspectedGroup);
            let simplifiedGroup = simplifyUsergroup(reorganizedGroup, mainDomain);
            result = simplifiedGroup;
        }
    } else if (domainKey) {
        if (domainKey == '*') {
            let inspectedDomains = inspectDomains(normalizedConfigs, aggregateConfAttrValues);
            let reorganizedDomains = reorganizeDomains(inspectedDomains);
            let simplifiedDomains = simplifyDomains(reorganizedDomains);
            result = simplifiedDomains;
        } else {
            let inspectedDomain = inspectDomain(domainKey, normalizedConfigs);
            let reorganizedDomain = reorganizeDomain(inspectedDomain);
            let simplifiedDomain = simplifyDomain(reorganizedDomain, mainDomain);            
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

export function inspectUsermanagement({usermanagement, usergroups, domains}, aggregateConfAttrValues = false) {
    let inspected = {};
    
    for (let userKey of Object.keys(usermanagement)) {
        inspected[userKey] = inspectUser(userKey, {usermanagement, usergroups, domains}, aggregateConfAttrValues);
    }

    return inspected;
}

export function inspectUser(userKey, {usermanagement, usergroups, domains}, aggregateConfAttrValues = false) {
    if (!userKey) throw Error(util.format("userKey is missing"));

    let user = usermanagement[userKey];
    if (!user) throw Error(util.format("user '%s' not found", userKey));

    let domainKeys = new Set();
    let groupKeys = new Set();
    for (let groupKey of user.groups.sort((a, b) => {
        if (a.prio === null && b.prio === null) return 0;
        if (a.prio === null) return 1;
        if (b.prio === null) return -1;
        return a.prio - b.prio;
      })) {
        let groupAndDomain = extractGroupAndDomain(groupKey);
        let domainKey = groupAndDomain.domain;
        domainKeys.add(domainKey);
        groupKeys.add(groupKey);

        if (!usergroups[groupKey]) throw Error(util.format("usergroup '%s' of user '%s' not found", groupKey, userKey));
    }

    let aggrConfigAttrs = {};

    let configurationAttributes = user.configurationAttributes;
    if (configurationAttributes) {
        for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
            let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
            if (!aggrConfigAttrs[configurationAttributeKey]) {
                aggrConfigAttrs[configurationAttributeKey] = [];
            }
            if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
            } else if (aggrConfigAttrs[configurationAttributeKey].length > 0) {
                logDebug(util.format("configurationAttribute '%s' of user '%s' skipped sinced it already exists in Array", configurationAttributeKey, userKey));
            }
        }
    }

    for (let groupKey of groupKeys) {
        let group = usergroups[groupKey];
        let configurationAttributes = group.configurationAttributes;
        if (configurationAttributes) {
            for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                if (!aggrConfigAttrs[configurationAttributeKey]) {
                    aggrConfigAttrs[configurationAttributeKey] = [];
                }
                if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                    for (let configurationAttribute of configurationAttributeArray) {
                        aggrConfigAttrs[configurationAttributeKey].push(Object.assign({}, configurationAttribute, {_group: groupKey}));
                    }
                } else if (aggrConfigAttrs[configurationAttributeKey].length > 0) {
                    logDebug(util.format("configurationAttribute '%s' of group '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, groupKey, userKey));
                }
            }
        }
    }

    for (let domainKey of domainKeys) {            
        let domain = domains[domainKey];
        let configurationAttributes = domain.configurationAttributes;
        if (configurationAttributes) {
            for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                if (!aggrConfigAttrs[configurationAttributeKey]) {
                    aggrConfigAttrs[configurationAttributeKey] = [];
                }
                if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                    for (let configurationAttribute of configurationAttributeArray) {
                        aggrConfigAttrs[configurationAttributeKey].push(Object.assign({}, configurationAttribute, {_domain: domainKey}));
                    }
                } else if (aggrConfigAttrs[configurationAttributeKey].length > 0) {
                    logDebug(util.format("configurationAttribute '%s' of domain '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, domainKey, userKey));
                }
            }
        }
    }

    let inspected = Object.assign({}, user, {
        configurationAttributes: aggrConfigAttrs,
    });
    return inspected;
}

// ---

export function inspectUsergroups({ usergroups }) {
    let inspected = {};
    
    for (let groupKey of Object.keys(usergroups)) {
        inspected[groupKey] = inspectUsergroup(groupKey, { usergroups });
    }

    return inspected;
}

export function inspectUsergroup(groupKey, { usergroups }) {
    if (!groupKey) throw Error(util.format("groupKey is missing"));

    let normalizedGroupKey = groupKey.includes('@') ? groupKey : util.format('%s@LOCAL', groupKey);

    let group = usergroups[normalizedGroupKey];
    if (!group) throw Error(util.format("group '%s' not found", normalizedGroupKey));

    let inspected = Object.assign({}, group);
    return inspected;
}

// ---

export function inspectDomains({ domains }) {
    let inspected = {};
    
    for (let domainKey of Object.keys(domains)) {
        inspected[domainKey] = inspectDomain(domainKey, { domains });
    }

    return inspected;
}

export function inspectDomain(domainKey, { domains }) {
    if (!domainKey) throw Error(util.format("domainKey is missing"));

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' not found", domainKey));

    let inspected = Object.assign({}, domain);
    return inspected;
}