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

    let inspectedConfigurationAttributes = Object.assign({}, user.configurationAttributes);

    for (let groupKey of groupKeys) {
        let group = usergroups[groupKey];
        let configurationAttributes = group.configurationAttributes;
        completeConfigAttr(inspectedConfigurationAttributes, configurationAttributes, userKey, {_group: groupKey}, aggregateConfAttrValues);
    }

    for (let domainKey of domainKeys) {            
        let domain = domains[domainKey];
        let configurationAttributes = domain.configurationAttributes;
        completeConfigAttr(inspectedConfigurationAttributes, configurationAttributes, userKey, {_domain: domainKey}, aggregateConfAttrValues);
    }

    let inspected = Object.assign({}, user, {
        configurationAttributes: inspectedConfigurationAttributes,
    });
    return inspected;
}


// ---

export function inspectUsergroups({ usergroups, domains }, aggregateConfAttrValues = false) {
    let inspected = {};
    
    for (let groupKey of Object.keys(usergroups)) {
        inspected[groupKey] = inspectUsergroup(groupKey, { usergroups, domains });
    }

    return inspected;
}

export function inspectUsergroup(groupKey, { usergroups, domains }, aggregateConfAttrValues = false) {
    if (!groupKey) throw Error(util.format("groupKey is missing"));

    let group = usergroups[groupKey];
    if (!group) throw Error(util.format("group '%s' not found", groupKey));

    let groupAndDomainKeys = extractGroupAndDomain(groupKey);
    let domainKey = groupAndDomainKeys.domain;

    let domain = domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' of usergroup '%s' not found", domainKey, groupKey));

    let inspectedConfigurationAttributes = Object.assign({}, group.configurationAttributes);
    completeConfigAttr(inspectedConfigurationAttributes, domain.configurationAttributes, groupKey, {_domain: domainKey}, aggregateConfAttrValues);

    let inspected = Object.assign({}, group, {
        configurationAttributes: inspectedConfigurationAttributes,
    });


    return inspected;
}

// ---

export function inspectDomains({ domains }, aggregateConfAttrValues = false) {
    let inspected = {};
    
    for (let domainKey of Object.keys(domains)) {
        inspected[domainKey] = inspectDomain(domainKey, { domains });
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