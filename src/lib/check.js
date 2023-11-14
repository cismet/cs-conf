import util from "util";

import { normalizeAttribute, normalizeClass, normalizeConfig, normalizeConfigs, normalizeConfigurationAttribute, normalizeConfigurationAttributeValue, normalizeDomain, normalizeDynchildhelper, normalizeNode, normalizeUser, normalizeUsergroup } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut, logVerbose, logWarn } from "./tools/tools";
import { extractGroupAndDomain } from "./tools/cids";
import { containWildcards } from "./import";

export default async function csCheck(options) {
    let configs = readConfigFiles(global.configsDir);
    if (configs == null) throw Error("config not set");

    checkConfigs(configs);
    logOut("configuration ok", { noSilent: true });
}

export function checkConfigs(configs) {
    let normalized = normalizeConfigs(configs);

    logOut("Checking configs ...");

    checkConfigurationAttributes(normalized);
    checkDomains(normalized);
    checkUsergroups(normalized);
    checkUsermanagement(normalized);
    checkClasses(normalized);
    checkDynchildhelpers(normalized);
    checkStructure(normalized);
}


export function checkConfigurationAttributes(configs) {
    logVerbose(" ↳ checking configurationAttributes");
    for (let configurationAttributeKey of Object.keys(configs.configurationAttributes)) {
        checkConfigurationAttribute(configurationAttributeKey, configs);
    }
}

export function checkConfigurationAttribute(configurationAttributeKey, configs) {
    if (!configurationAttributeKey) throw Error(util.format("configurationAttributeKey is missing"));
    let configurationAttribute = configs.configurationAttributes[configurationAttributeKey]
    if (!configurationAttribute) throw Error(util.format("configurationAttribute '%s' not found", configurationAttributeKey));

    let normalized = normalizeConfigurationAttribute(configurationAttribute);

    let foundAny = false;
    for (let domain of Object.values(configs.domains)) {
        if (domain && domain.configurationAttributes && domain.configurationAttributes[configurationAttributeKey]) {
            foundAny = true;
        }
    }
    for (let group of Object.values(configs.usergroups)) {
        if (group && group.configurationAttributes && group.configurationAttributes[configurationAttributeKey]) {
            foundAny = true;
        }
    }

    for (let user of Object.values(configs.usermanagement)) {
        if (user && user.configurationAttributes && user.configurationAttributes[configurationAttributeKey]) {
            foundAny = true;
        }
    }

    if (!foundAny) {
        logWarn(util.format("configurationAttribute '%s' is not used anywhere.", configurationAttributeKey));
    }
}

export function checkDomains(configs) {
    logVerbose(" ↳ checking domains");
    for (let domainKey of Object.keys(configs.domains)) {
        checkDomain(domainKey, configs);
    }
}

export function checkDomain(domainKey, configs) {    
    if (!domainKey) throw Error(util.format("domainKey is missing"));
    let domain = configs.domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' not found", domainKey));

    let normalized = normalizeDomain(domainKey, domain);
    checkConfigurationAttributeValues(normalized.configurationAttributes, configs);
}

export function checkUsergroups(config) {
    logVerbose(" ↳ checking usergroups");
    for (let usergroupKey of Object.keys(config.usergroups)) {
        checkUsergroup(usergroupKey, config);
    }
}

export function checkUsergroup(usergroupKey, config) {    
    if (!usergroupKey) throw Error(util.format("usergroupKey is missing"));
    let usergroup = config.usergroups[usergroupKey];
    if (!usergroup) throw Error(util.format("usergroup '%s' not found", usergroupKey));

    let normalized = normalizeUsergroup(usergroupKey, usergroup);

    let groupAndDomainKeys = extractGroupAndDomain(usergroupKey);
    let domainKey = groupAndDomainKeys.domain;
    let domain = config.domains[domainKey];
    if (!domain) throw Error(util.format("domain '%s' of usergroup '%s' not found", domainKey, usergroupKey));

    checkConfigurationAttributeValues(normalized.configurationAttributes, config);
}

export function checkUsermanagement(configs) {
    logVerbose(" ↳ checking usermanagement");
    for (let userKey of Object.keys(configs.usermanagement)) {
        checkUser(userKey, configs);
    }
}

export function checkUser(userKey, configs) {
    if (!userKey) throw Error(util.format("userKey is missing"));
    let user = configs.usermanagement[userKey];
    if (!user) throw Error(util.format("user '%s' not found", userKey));

    let normalized = normalizeUser(user);

    if (normalized.pw_hash == null) throw Error(util.format("normalizeUsermanagement: [%s] missing pw_hash", userKey));
    if (normalized.salt == null) throw Error(util.format("normalizeUsermanagement: [%s] missing salt", userKey));
    if (normalized.password != null) throw Error(util.format("normalizeUsermanagement: [%s] password not allowed", userKey));

    for (let groupKey of normalized.groups) {
        if (containWildcards(groupKey)) continue;
        if (!configs.usergroups[groupKey]) throw Error(util.format("usergroup '%s' of user '%s' not found", groupKey, userKey));
    }

    for (let shadowUserKey of normalized.shadows) {
        let shadowUser = configs.usermanagement[shadowUserKey];
        if (!shadowUser) throw Error(util.format("shadowUser '%s' not found for '%s'", shadowUserKey, userKey));
    }

    checkConfigurationAttributeValues(normalized.configurationAttributes, configs);
}

export function checkClasses(configs) {
    logVerbose(" ↳ checking classes");
    for (let classKey of Object.keys(configs.classes)) {
        checkClass(classKey, configs);
    }
}

export function checkClass(classKey, configs) {
    let clazz = configs.classes[classKey];
    let policies = configs.config.policies;
    let normalized = normalizeClass(classKey, clazz, policies);

    checkSpecial(normalized.toString);
    checkSpecial(normalized.editor);
    checkSpecial(normalized.renderer);

    let normalizedAttributes = normalized.attributes;
    for (let attributeKey of Object.keys(normalizedAttributes)) {
        checkAttribute(attributeKey, classKey, configs);
    }

    let attributePk = normalizedAttributes[normalized.pk];
    if (!attributePk) throw Error(util.format("primary key attribute '%s' missing", normalized.pk));
    if (
        attributePk.cidsType != null ||
        attributePk.oneToMany != null ||
        attributePk.manyToMany != null                
    ) throw Error("normalizeAttributes: primary key can only have dbType, no cidsType allowed");
}

function checkSpecial(special, classKey) {
    // exclude toString()
    if (typeof special !== 'function' && special != null) {
        if (special.type == null) throw Error(util.format("normalizeClasses: [%s] type missing", classKey));
        if (special.class == null) throw Error(util.format("normalizeClasses: [%s] class missing", classKey));
    }
}

export function checkAttribute(attributeKey, classKey, configs) {
    let config = configs.config;
    let normalizedConfigs = normalizeConfig(config);
    let clazz = configs.classes[classKey];
    let normalizedClass = normalizeClass(classKey, clazz, normalizedConfigs.policies);
    let attribute = normalizedClass.attributes[attributeKey];
    let normalized = normalizeAttribute(attribute, attributeKey);    

    let types = [];
    if (normalized.dbType != null) types.push(normalized.dbType);
    if (normalized.cidsType != null) types.push(normalized.cidsType);
    if (normalized.oneToMany != null) types.push(normalized.oneToMany);
    if (normalized.manyToMany != null) types.push(normalized.manyToMany);

    if (normalized.dbType == null && (normalized.precision != null || normalized.scale != null)) throw Error(util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", classKey, attributeKey));
    if (types.length == 0) throw Error(util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", classKey, attributeKey)); 
    if (types.length > 1) throw Error(util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", classKey, attributeKey));
}

export function checkStructure(configs) {
    logVerbose(" ↳ checking structure");
    checkNodes(configs.structure, configs);
}

export function checkNodes(nodes, configs) {
    let previousNode = null;
    for (let node of nodes) {
        checkNode(node, previousNode, configs);
    };
}

export function checkNode(node, previousNode, configs) {
    let normalized = normalizeNode(node);
    if (normalized.link == null) {
        if (normalized.name == null) throw Error(util.format("normalizeStructure: missing name for node", previousNode ? util.format("the one after %s)", previousNode.name) : "(the first one)"));
        if (normalized.dynamic_children_file != null && normalized.dynamic_children != null) throw Error(util.format("normalizeStructure: [%s] dynamic_children and dynamic_children_file can't both be set", normalized.name));
        //if (normalized.children != null && (normalized.dynamic_children_file != null || nodnormalizede.dynamic_children != null)){ console.table(normalized);  throw Error("children and dynamic_children(_file) can't both be set"});
    }
}

export function checkDynchildhelpers(configs) {
    logVerbose(" ↳ checking dynchildhelpers");
    for (let dynchildhelperKey of Object.keys(configs.dynchildhelpers)) {
        checkDynchildhelper(dynchildhelperKey, configs);
    }
}

export function checkDynchildhelper(dynchildhelperKey, configs) {
    let dynchildhelper = configs.dynchildhelpers[dynchildhelperKey];
    let normalized = normalizeDynchildhelper(dynchildhelper);

    if (normalized.code == null && normalized.code_file == null) throw Error(util.format("dynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name));
    if (normalized.code != null && normalized.code_file != null) throw Error(util.format("dynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name));
}

export function checkConfigurationAttributeValues(configurationAttributeValues, configs) {
    for (let configurationAttributeKey of Object.keys(configurationAttributeValues)) {
        let configurationAttributeValueEntry = configurationAttributeValues[configurationAttributeKey];
        let configurationAttributeArray = Array.isArray(configurationAttributeValueEntry) ? configurationAttributeValueEntry : [configurationAttributeValueEntry];
        for (let configurationAttributeValue of configurationAttributeArray) {
            let configurationAttribute = configs.configurationAttributes[configurationAttributeKey];
            if (!configurationAttribute) throw Error(util.format("configurationAttribute '%s' not found", configurationAttributeKey));
            checkConfigurationAttributeValue(configurationAttributeKey, configurationAttributeValue, configurationAttribute);
        }
    }    
}

export function checkConfigurationAttributeValue(configurationAttributeKey, configurationAttributeValue, configurationAttribute) {
    let normalized = normalizeConfigurationAttributeValue(configurationAttributeValue);
    let normalizedConfigurationAttribute = normalizeConfigurationAttribute(configurationAttribute);

    if (!normalizedConfigurationAttribute) throw Error(util.format("configurationAttribute '%s' node found", configurationAttributeKey));
    if (normalizedConfigurationAttribute.type == null) throw Error(util.format("'type' for configurationAttribute '%s' is missing", configurationAttributeKey));
    switch (normalizedConfigurationAttribute.type) {
        case 'action': {
            if (normalized.value != null) throw Error(util.format("configurationAttribute '%s' is of type 'action'. no 'value' is allowed.", configurationAttributeKey));
            if (normalized.xmlfile != null) throw Error(util.format("configurationAttribute '%s' is of type 'action'. 'xmfile' is allowed.", configurationAttributeKey));
        } break;
        case 'value': {
            if (normalized.xmlfile != null) throw Error(util.format("configurationAttribute '%s' is of type 'value'. 'xmfile' is allowed.", configurationAttributeKey));
            if (normalized.value == null) throw Error(util.format("configurationAttribute '%s' is of type 'value', but no 'value' is set.", configurationAttributeKey));
        } break;
        case 'xml': {
            if (normalized.value != null) throw Error(util.format("configurationAttribute '%s' is of type 'action'. no 'value' is allowed.", configurationAttributeKey));
            if (normalized.xmlfile == null) throw Error(util.format("configurationAttribute '%s' is of type 'xml', but no 'xmlfile' is set.", configurationAttributeKey));
        } break;
    }

}
