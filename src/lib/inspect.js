import util from "util";
import stringify from "json-stringify-pretty-compact";
import slug from "slug";

import { readConfigFiles, writeFile } from "./tools/configFiles";
import { logOut, logWarn } from "./tools/tools";
import { completeConfigurationAttributeValues, extendLocalDomain, extractGroupAndDomain } from "./tools/cids";

import { normalizeConfigs, normalizeConfigurationAttribute, normalizeDomain, normalizeUser, normalizeUsergroup } from "./normalize";
import { simplifyUsermanagement, simplifyUsergroups, simplifyDomains, simplifyConfigurationAttributes, simplifyUser } from "./simplify";
import { reorganizeUsermanagement, reorganizeUsergroups, reorganizeDomains, reorganizeConfigurationAttributes } from "./reorganize";
import { preprocessUsermanagement } from "./import";
import { postprocessUser } from "./export";
import { checkConfigurationAttribute, checkDomain, checkUsergroup, checkUsermanagement } from "./check";
import { checkUser } from "../../build/lib/check";

export default async function csInspect({ configurationAttributeKey, domainKey, groupKey, userKey, aggregateConfigurationAttributeValues = false, print = false, fileTarget }) {
    let configs = readConfigFiles(global.configsDir);    
    if (configs == null) throw Error("config not set");

    let normalizedConfigs = normalizeConfigs(configs);
    checkUsermanagement(normalizedConfigs);
    
    let preprocessedUsermanagement = preprocessUsermanagement(normalizedConfigs.usermanagement, normalizedConfigs.usergroups, normalizedConfigs.configurationAttributes)
    Object.assign(normalizedConfigs, {
        usermanagement: preprocessedUsermanagement,
    })

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
                let inspectedUsermanagement = inspectUsermanagement(normalizedConfigs, { aggregateConfigurationAttributeValues });
                let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
                let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, { removeUnprocessedInfo: false });
                result = simplifiedUsermanamgement;
            } else {
                let inspectedUsermanagement = inspectUser(userKey, normalizedConfigs, { aggregateConfigurationAttributeValues });
                let reorganizedUsermanagement = reorganizeUsermanagement(inspectedUsermanagement);
                let simplifiedUsermanamgement = simplifyUsermanagement(reorganizedUsermanagement, { normalize: false, removeUnprocessedInfo: false })
                result = simplifiedUsermanamgement;
            }    
        } break;
        case "group": {
            if (groupKey == '*') {
                let inspectedUsergroups = inspectUsergroups(normalizedConfigs, { aggregateConfigurationAttributeValues });
                let reorganizedUsergroups = reorganizeUsergroups(inspectedUsergroups);
                let simplifiedUsergroups = simplifyUsergroups(reorganizedUsergroups);
                result = simplifiedUsergroups;
            } else {
                let normalizedGroupKey = extendLocalDomain(groupKey);
                let inspectedGroups = inspectUsergroup(normalizedGroupKey, normalizedConfigs, { aggregateConfigurationAttributeValues });
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
                let inspectedConfigurationAttributes = inspectConfigurationAttributes(normalizedConfigs);
                let reorganizedConfigurationAttributes = reorganizeConfigurationAttributes(inspectedConfigurationAttributes);
                let simplifiedConfigurationAttributes = simplifyConfigurationAttributes(reorganizedConfigurationAttributes);
                result = simplifiedConfigurationAttributes;
            } else {
                let inspectedConfigurationAttributes = inspectConfigurationAttribute(configurationAttributeKey, normalizedConfigs);
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

export function inspectConfigurationAttributes(configs) {
    let inspected = {};
    for (let configurationAttributeKey of Object.keys(configs.configurationAttributes)) {
        Object.assign(inspected, inspectConfigurationAttribute(configurationAttributeKey, configs));
    }
    return inspected;
}

export function inspectConfigurationAttribute(configurationAttributeKey, configs) {
    checkConfigurationAttribute(configurationAttributeKey, configs);

    let { configurationAttributes, usermanagement, usergroups, domains } = configs;
    let configurationAttribute = configurationAttributes[configurationAttributeKey];
    let normalized = normalizeConfigurationAttribute(configurationAttribute);

    let domainValues = {};
    for (let [ domainKey, domain ] of Object.entries(domains)) {
        if (domain && domain.configurationAttributes && domain.configurationAttributes[configurationAttributeKey]) {
            domainValues[domainKey] = domain.configurationAttributes[configurationAttributeKey];
        }
    }

    let groupValues = {};
    for (let [ groupKey, group ] of Object.entries(usergroups)) {
        if (group && group.configurationAttributes && group.configurationAttributes[configurationAttributeKey]) {
            groupValues[groupKey] = group.configurationAttributes[configurationAttributeKey];
        }
    }

    let userValues = {};
    for (let [ userKey, user ] of Object.entries(usermanagement)) {
        if (user && user.configurationAttributes && user.configurationAttributes[configurationAttributeKey]) {
            userValues[userKey] = user.configurationAttributes[configurationAttributeKey];
        }
    }

    let inspectedConfigurationAttribute = Object.assign({
        domainValues,
        groupValues,
        userValues,
    });

    let inspected = {};
    inspected[configurationAttributeKey] = Object.assign({}, normalized, { inspected: inspectedConfigurationAttribute });
    return inspected;

}

export function inspectUsermanagement(configs, { aggregateConfigurationAttributeValues = false } = {}) {
    let inspected = {};    
    for (let userKey of Object.keys(configs.usermanagement)) {
        Object.assign(inspected, inspectUser(userKey, configs, { aggregateConfigurationAttributeValues }));
    }
    return inspected;
}

export function inspectUser(userKey, configs, { aggregateConfigurationAttributeValues = false } = {}) {
    checkUser(userKey, configs);    

    let { usermanagement, usergroups, domains, configurationAttributes, classes, config } = configs;
    let user = usermanagement[userKey];
    let normalized = normalizeUser(user);

    let domainKeySet = new Set();
    let groupKeySet = new Set();
    for (let groupKey of normalized.groups.sort((a, b) => {
        if (a.prio === null && b.prio === null) return 0;
        if (a.prio === null) return 1;
        if (b.prio === null) return -1;
        return a.prio - b.prio;
      })) {
        let groupAndDomain = extractGroupAndDomain(groupKey);
        let domainKey = groupAndDomain.domain;
        domainKeySet.add(domainKey);
        groupKeySet.add(groupKey);
    }

    let allConfigurationAttributeValues = Object.assign({}, normalized.configurationAttributes);    
    for (let groupKey of groupKeySet) {
        let group = usergroups[groupKey];
        let groupConfigurationAttributeValues = group.configurationAttributes;
        let completition = {group: groupKey};
        completeConfigurationAttributeValues(configurationAttributes, allConfigurationAttributeValues, groupConfigurationAttributeValues, userKey, completition, aggregateConfigurationAttributeValues);
    }
    for (let domainKey of domainKeySet) {            
        let domain = domains[domainKey];
        let domainConfigurationAttributeValues = domain.configurationAttributes;
        let completition = {domain: domainKey};
        completeConfigurationAttributeValues(configurationAttributes, allConfigurationAttributeValues, domainConfigurationAttributeValues, userKey, completition, aggregateConfigurationAttributeValues);
    }

    let postprocessedUser = simplifyUser(postprocessUser(normalized));
    let shadowMemberOf = {};
    if (postprocessedUser.shadows) {
        for (let shadowKey of postprocessedUser.shadows) {
            shadowMemberOf[shadowKey] = usermanagement[shadowKey].groups;
        }
    }
    let memberOf = [...groupKeySet];
    let permissions = permissionsForGroups([...groupKeySet], classes, config.policyRules);

    let inspectedUser = {
        memberOf,
        shadowMemberOf,
        allConfigurationAttributes: allConfigurationAttributeValues,
        permissions
    };

    let inspected = {};
    inspected[userKey] = Object.assign({}, postprocessedUser, { inspected: inspectedUser });

    return inspected;
}

// ---

export function inspectUsergroups(configs, { aggregateConfigurationAttributeValues = false } = {}) {
    let inspected = {};    
    for (let groupKey of Object.keys(configs.usergroups)) {
        Object.assign(inspected, inspectUsergroup(groupKey, configs, { aggregateConfigurationAttributeValues }));
    }
    return inspected;
}

export function inspectUsergroup(usergroupKey, configs, { aggregateConfigurationAttributeValues = false } = {}) {
    checkUsergroup(usergroupKey, configs);

    let { usermanagement, configurationAttributes, usergroups, domains, classes, config } = configs;
    let usergroup = usergroups[usergroupKey];
    let normalized = normalizeUsergroup(usergroup);

    let groupAndDomainKeys = extractGroupAndDomain(usergroupKey);
    let domainKey = groupAndDomainKeys.domain;
    let domain = domains[domainKey];

    let allConfigurationAttributeValues = Object.assign({}, normalized.configurationAttributes);
    let completition = {domain: domainKey};
    let domainConfigurationAttributeValues = domain.configurationAttributes;
    completeConfigurationAttributeValues(configurationAttributes, allConfigurationAttributeValues, domainConfigurationAttributeValues, usergroupKey, completition, aggregateConfigurationAttributeValues);

    let userKeySet = new Set();
    for (let userKey of Object.keys(usermanagement)) {
        let user = usermanagement[userKey];
        if (user.groups && user.groups.includes(usergroupKey)) {
            userKeySet.add(userKey);
        }
    }
    let members = [...userKeySet];
    let permissions = permissionsForGroups([usergroupKey], classes, config.policyRules);

    let inspectedGroup = { 
        members,
        allConfigurationAttributes: allConfigurationAttributeValues,
        permissions,
    };

    let inspected = {};
    inspected[usergroupKey] = Object.assign({}, normalized, { inspected: inspectedGroup });

    return inspected;
}

// ---

export function inspectDomains(configs) {
    let inspected = {};
    for (let domainKey of Object.keys(configs.domains)) {
        Object.assign(inspected, inspectDomain(domainKey, configs));
    }
    return inspected;
}

export function inspectDomain(domainKey, configs) {
    checkDomain(domainKey, configs);

    let { domains, usergroups } = configs;
    let domain = domains[domainKey];
    let normalized = normalizeDomain(domain);

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
    inspected[domainKey] = Object.assign({}, normalized, { inspected: inspectedDomain });

    return inspected;
}

// ---

function permissionsForGroups(groupKeys, classes, policyRules) {
    let readPermClassesSet = new Set();
    let writePermClassesSet = new Set();
    let readPermAttributesSet = new Set();
    let writePermAttributesSet = new Set();
    
    for (let classKey of Object.keys(classes)) {
        let clazz = classes[classKey];
        if (clazz) {        
            let classPolicy = clazz.policy;

            let defaultPolicy = policyRules && classPolicy ? policyRules[classPolicy] : null;            
            let defaultCanReadClass = defaultPolicy && defaultPolicy.defaultRead;
            let defaultCanWriteClass = defaultPolicy && defaultPolicy.defaultWrite;
            
            let classCanRead = false;
            for (let groupKey of groupKeys) {        
                if (clazz.readPerms) {
                    let groupReadPerm = clazz.readPerms.includes(groupKey);   
                    let groupCanRead = defaultCanReadClass ? !groupReadPerm : groupReadPerm;
                    if (groupCanRead) {
                        classCanRead = true
                        break;
                    }
                }
            }

            let classCanWrite = false;
            for (let groupKey of groupKeys) {        
                if (clazz.writePerms) {
                    let groupWritePerm = clazz.writePerms.includes(groupKey);   
                    let groupCanWrite = defaultCanWriteClass ? !groupWritePerm : groupWritePerm;
                    if (groupCanWrite) {
                        classCanWrite = true;
                        break;
                    }
                }
            }
            
            if (classCanRead) {
                readPermClassesSet.add(classKey);
            }
            if (classCanWrite) {
                writePermClassesSet.add(classKey);
            }

            let attributes = clazz.attributes;
            // TODO inspect server policy for automatic interpretation
            if (attributes) {
                let attributePolicy = clazz.attribute_policy
                let defaultAttributesPolicy = policyRules && attributePolicy ? policyRules[attributePolicy] : null;
                let defaultCanReadAttributes =  defaultAttributesPolicy && defaultAttributesPolicy.defaultRead;
                let defaultCanWriteAttributes =  defaultAttributesPolicy && defaultAttributesPolicy.defaultWrite;
                for (let attributeKey of Object.keys(attributes)) {
                    let attribute = attributes[attributeKey];
                    if (attribute) {
                        let attributeCanRead = false;
                        if (classCanRead) {
                            for (let groupKey of groupKeys) {        
                                if (attribute.readPerms) {
                                    let groupReadPerm = attribute.readPerms.includes(groupKey);   
                                    let groupCanRead = defaultCanReadAttributes ? !groupReadPerm : groupReadPerm;
                                    if (groupCanRead) {
                                        attributeCanRead = true;
                                        break;
                                    }
                                }
                            }
                        }

                        let attributeCanWrite = false;
                        if (classCanWrite) {
                            for (let groupKey of groupKeys) {        
                                if (attribute.writePerms) {
                                    let groupWritePerm = attribute.writePerms.includes(groupKey);   
                                    let groupCanWrite = defaultCanWriteAttributes ? !groupWritePerm : groupWritePerm;
                                    if (groupCanWrite) {
                                        attributeCanWrite = true;
                                       
                                        break;
                                    }
                                }
                            }
                        }

                        let fullAttributeKey = util.format("%s.%s", classKey, attributeKey);
                        if (attributeCanRead) {
                            readPermAttributesSet.add(fullAttributeKey);
                        }
                        if (attributeCanWrite) {
                            writePermAttributesSet.add(fullAttributeKey);
                        }
                    }
                }
            }
        }
    }

    let canReadClasses = readPermClassesSet.size > 0 ? [...readPermClassesSet] : [];
    let canWriteClasses = writePermClassesSet.size > 0 ? [...writePermClassesSet] : [];
    let canReadAttributes = readPermAttributesSet.size > 0 ? [...readPermAttributesSet] : [];
    let canWriteAttributes = writePermAttributesSet.size > 0 ? [...writePermAttributesSet] : [];

    return {
        canReadClasses,
        canWriteClasses,
        canReadAttributes,
        canWriteAttributes,
    };
}