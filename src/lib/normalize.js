import util from "util";

import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain } from "./tools/cids";

import { 
    defaultAdditionalInfos, 
    defaultAttribute, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributeValue, 
    defaultClass, 
    defaultDomain, 
    defaultDomainInspected, 
    defaultDynchildhelper, 
    defaultNode, 
    defaultUser, 
    defaultUserInspected,
    defaultUserGroup, 
    defaultUserGroupInspected,
    defaultConfigurationAttribute,
    defaultConfigurationAttributeInspected,
    defaultConfigPolicyRules,
    defaultConfigPolicies,
    defaultUserGroupInspectedPermissions,
    defaultUserInspectedPermissions,
    defaultConfigs,
    defaultAttributePrimary,
} from "./tools/defaultObjects";

// ---

export default async function csNormalize(options) {
    let { targetDir } = options;
    let configs = readConfigFiles(global.configsDir);
    if (configs == null) throw Error("config not set");

    let normalized = normalizeConfigs(configs);
    writeConfigFiles(normalized, targetDir);
    return normalized;
}

// ---

export function normalizeConfigs(configs = {}) {
    let normalized = configs.normalized ? configs : Object.assign(defaultConfigs(), configs, {
        config: normalizeConfig(configs.config),
        additionalInfos: normalizeAdditionalInfos(configs.additionalInfos),
        configurationAttributes: normalizeConfigurationAttributes(configs.configurationAttributes),
        domains: normalizeDomains(configs.domains), 
        usergroups: normalizeUsergroups(configs.usergroups), 
        usermanagement: normalizeUsermanagement(configs.usermanagement), 
        classes: normalizeClasses(configs.classes, configs.config.policies), 
        dynchildhelpers: normalizeDynchildhelpers(configs.dynchildhelpers),        
        structure: normalizeStructure(configs.structure), 
        normalized: true
    });

    return normalized;
}

export function normalizeConfig(config = {}) {
    let normalized = config.normalized ? config : Object.assign(defaultConfig(), config, {
        connection: normalizeConfigConnection(config.connection),
        sync: normalizeConfigSync(config.sync),
        policies: normalizeConfigPolicies(config.policies),
        policyRules: normalizeConfigPolicyRules(config.policyRules), 
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigConnection(connection = {}) {
    let normalized = connection.normalized ? connection : Object.assign(defaultConfigConnection(), connection, { 
        normalized: true, 
    });
    return normalized;
}

export function normalizeConfigSync(sync = {}) {
    let normalized = sync.normalized ? sync : Object.assign(defaultConfigSync(), sync, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigPolicies(policies = {}) {
    let normalized = policies.normalized ? policies : Object.assign(defaultConfigPolicies(), policies, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeAdditionalInfos(additionalInfos = {}) {
    let normalized = additionalInfos.normalized ? additionalInfos : Object.assign(defaultAdditionalInfos(), additionalInfos, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeClasses(classes = {}, policies = defaultConfigPolicies()) {
    let normalized = {};    
    for (let classKey of Object.keys(classes)) {
        let clazz = classes[classKey];
        let normalizedClass = normalizeClass(classKey, clazz, policies);
        normalized[classKey.toLowerCase()] = normalizedClass;
    }
    return normalized;
}

export function normalizeClass(classKey, clazz = {}, policies = defaultConfigPolicies()) {
    let normalized = clazz.normalized ? clazz : Object.assign(defaultClass(), clazz, {
        name: clazz.name ?? classKey,
        toString: normalizeSpecial(clazz.toString),
        editor: normalizeSpecial(clazz.editor),
        renderer: normalizeSpecial(clazz.renderer),
        pk: clazz.pk ? clazz.pk.toLowerCase() : defaultClass().pk,
        attributes: normalizeAttributes(clazz.attributes, clazz.pk ?? defaultClass().pk, classKey),
        icon: null,
        policy: clazz.policy ?? policies.server,
        attribute_policy: clazz.attribute_policy ?? policies.attributes,
        classIcon: clazz.classIcon || clazz.icon || null,
        objectIcon: clazz.objectIcon || clazz.icon || null,
        readPerms: normalizePerms(clazz.readPerms),
        writePerms: normalizePerms(clazz.writePerms),
        normalized: true,
    });
    return normalized;
}

function normalizeAttributes(attributes, pk, classKey) {
    let normalized = {};

    if (attributes) {
        for (let attributeKey of Object.keys(attributes)) {
            let attribute = attributeKey == pk ? Object.assign({}, defaultAttributePrimary(classKey, pk), attributes[attributeKey]) : attributes[attributeKey];
            normalized[attributeKey.toLowerCase()] = normalizeAttribute(attribute, attributeKey);
        }

    }
    let attributePk = normalized[pk] ?? defaultAttributePrimary(classKey, pk);
    Object.assign(attributePk, {
        defaultValue: attributePk.defaultValue || util.format("nextval('%s_seq')", classKey),
    });
    normalized[pk] = normalizeAttribute(attributePk, pk);

    return normalized;
}

export function normalizeAttribute(attribute = {}, attributeKey) {
    let normalized = attribute.normalized ? attribute : Object.assign({}, defaultAttribute(), attribute, {
        name: attribute.name || attributeKey.toLowerCase(),
        cidsType: attribute.cidsType ? attribute.cidsType.toLowerCase() : null,
        oneToMany: attribute.oneToMany ? attribute.oneToMany.toLowerCase() : null,
        manyToMany: attribute.manyToMany ? attribute.manyToMany.toLowerCase() : null,
        readPerms: normalizePerms(attribute.readPerms),
        writePerms: normalizePerms(attribute.writePerms),
        normalized: true,
    });    
    return normalized;
}

export function normalizeDomains(domains = {}) {
    let normalized = {};
    for (let domainKey of Object.keys(domains)) {
        let domain = domains[domainKey];
        normalized[domainKey] = normalizeDomain(domain);
    }
    return normalized;
}

export function normalizeDomain(domain = {}) {
    let normalized = domain.normalized ? domain : Object.assign(defaultDomain(), domain, {
        configurationAttributes: normalizeConfigurationAttributeValues(domain.configurationAttributes),
        inspected: normalizeDomainInspected(domain.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeDomainInspected(domainInspected = {}) {
    let normalized = domainInspected.normalized ? domainInspected : Object.assign(defaultDomainInspected(), domainInspected, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeDynchildhelpers(dynchildhelpers = {}) {
    let normalized = {};
    for (let dynchildhelperKey of Object.keys(dynchildhelpers)) {
        let dynchildhelper = dynchildhelpers[dynchildhelperKey];
        normalized[dynchildhelperKey] = normalizeDynchildhelper(dynchildhelper);
    }
    return normalized;
}

export function normalizeDynchildhelper(dynchildhelper = {}) {
    let normalized = dynchildhelper.normalized ? dynchildhelper : Object.assign(defaultDynchildhelper(), dynchildhelper, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigPolicyRules(policyRules = {}) {
    let normalized = Object.assign(defaultConfigPolicyRules());    
    for (let policyRuleKey of Object.keys(normalized)) {
        let policyRule = policyRules[policyRuleKey];
        normalized[policyRuleKey] = normalizeConfigPolicyRule(policyRule, policyRuleKey);
    }
    return normalized;
}

export function normalizeConfigPolicyRule(policyRule = {}, policyRuleKey) {
    let normalized = policyRule.normalized ? policyRule : Object.assign({}, (defaultConfigPolicyRules()[policyRuleKey]), policyRule, { 
        normalized: true,
    });    
    return normalized;
}

export function normalizeStructure(structure = []) {
       return normalizeNodes(structure);
}

export function normalizeUsergroups(usergroups = {}) {
    let normalized = {};
    for (let groupKey of Object.keys(usergroups)) {
        let usergroup = usergroups[groupKey];
        normalized[extendLocalDomain(groupKey)] = normalizeUsergroup(usergroup);
    }
    return normalized;
}

export function normalizeUsergroup(usergroup = {}) {
    let normalized = usergroup.normalized ? usergroup : Object.assign(defaultUserGroup(), usergroup, {
        configurationAttributes: normalizeConfigurationAttributeValues(usergroup.configurationAttributes),
        inspected: normalizeUsergroupInspected(usergroup.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeUsergroupInspected(usergroupInspected = {}) {
    let normalized = usergroupInspected.normalized ? usergroupInspected : Object.assign(defaultUserGroupInspected(), usergroupInspected, {
        allConfigurationAttributes: normalizeConfigurationAttributeValues(usergroupInspected.allConfigurationAttributes),
        permissions: normalizeUsergroupInspectedPermissions(usergroupInspected.permissions),
        normalized: true,
    });
    return normalized;
}

export function normalizeUsergroupInspectedPermissions(usergroupInspectedPermissions = {}) {
    let normalized = usergroupInspectedPermissions.normalized ? usergroupInspectedPermissions : Object.assign(defaultUserGroupInspectedPermissions(), usergroupInspectedPermissions, {
        normalized: true,
    });
    return normalized;
}

export function normalizeUsermanagement(usermanagement = {}) {
    let normalized = {};
    for (let userKey of Object.keys(usermanagement)) {
        let user = usermanagement[userKey];
        normalized[userKey] = normalizeUser(user);
    }
    return normalized;
}

export function normalizeUser(user = {}) {
    let normalized;
    if (user.normalized) {
        normalized = user;
    } else {
        let shadows = user.shadows ? [...user.shadows] : [];
        let groups = normalizeGroups(user.groups);
        let configurationAttributes = normalizeConfigurationAttributeValues(user.configurationAttributes);

        let additionalInfo = user.additional_info;
        if (additionalInfo) {
            if (additionalInfo._unprocessed) {
                let _unprocessed = additionalInfo._unprocessed;
                shadows = _unprocessed.shadows ?? [];
                groups = _unprocessed.groups ?? [];
                configurationAttributes = _unprocessed.configurationAttributes ?? {};
                // TODO Warn if resulting groups and configuration-Attributes don't match
            }
        }    

        normalized = Object.assign(defaultUser(), user, {
            shadows,
            groups,
            configurationAttributes,
            inspected: normalizeUserInspected(user.inspected),
            normalized: true,
        });
    }
    return normalized;
}

export function normalizeUserInspected(userInspected = {}) {
    let normalized = userInspected.normalized ? userInspected : Object.assign(defaultUserInspected(), userInspected, { 
        memberOf: normalizeGroups(userInspected.memberOf),
        shadowMemberOf: normalizeshadowMemberOf(userInspected.shadowMemberOf),
        allConfigurationAttributes: normalizeConfigurationAttributeValues(userInspected.allConfigurationAttributes),
        permissions: normalizeUserInspectedPermissions(userInspected.permissions),
        normalized: true,
    });
    return normalized;
}

export function normalizeUserInspectedPermissions(userInspectedPermissions = {}) {
    let normalized = userInspectedPermissions.normalized ? userInspectedPermissions : Object.assign(defaultUserInspectedPermissions(), userInspectedPermissions, {
        normalized: true,
    });
    return normalized;
}

export function normalizeshadowMemberOf(shadowMemberOf = {}) {
    let normalized = {};
    for (let memberOfShadowKey of Object.keys(shadowMemberOf)) {
        let memberOfShadow = shadowMemberOf[memberOfShadowKey];
        normalized[memberOfShadowKey] = normalizeGroups(memberOfShadow);
    }
    Object.assign(normalized, shadowMemberOf);
    return normalized;
}

export function normalizeGroups(groups = []) {
    let normalized = [];
    for (let group of groups) {
        normalized.push(normalizeGroup(group));
    }
    return normalized;
}

export function normalizeGroup(group = "") {
    let normalized = extendLocalDomain(group);
    return normalized;
}

export function normalizePerms(perms = []) {
    let normalized = [];
    for (let permission of perms) {  
        normalized.push(extendLocalDomain(permission));
    }
    return normalized;
}


export function normalizeConfigurationAttributes(configurationAtributes = {}) {
    let normalized = {};
    for (let configurationAttributeKey of Object.keys(configurationAtributes)) {
        let configurationAtribute = configurationAtributes[configurationAttributeKey];
        if (configurationAtribute != null) {
            normalized[configurationAttributeKey] = normalizeConfigurationAttribute(configurationAtribute);
        }
    }
    return normalized;
}

export function normalizeConfigurationAttribute(configurationAttribute = {}) {
    let normalized = configurationAttribute.normalized ? configurationAttribute : Object.assign(defaultConfigurationAttribute(), configurationAttribute, {
        inspected: normalizeConfigurationAttributeInspected(configurationAttribute.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigurationAttributeInspected(configurationAttributeInspected = {}) {
    let normalized = configurationAttributeInspected.normalized ? configurationAttributeInspected : Object.assign(defaultConfigurationAttributeInspected(), configurationAttributeInspected, {
        domainValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.domainValues),
        groupValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.groupValues),
        userValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.userValues),
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigurationAttributeInspectedValues(configurationAttributeInspectedValues = {}) {
    let normalized = {};
    for (let configurationAttributeInspectedValueKey of Object.keys(configurationAttributeInspectedValues)) {
        let configurationAttributeInspectedValue = configurationAttributeInspectedValues[configurationAttributeInspectedValueKey];
        normalized[configurationAttributeInspectedValueKey] = configurationAttributeInspectedValue ?? [];
    }
    return normalized;
}

export function normalizeConfigurationAttributeValues(configurationAttributeValues = {}) {
    let normalized = {};
    for (let configurationAttributeKey of Object.keys(configurationAttributeValues)) {
        let configurationAttributeValue = configurationAttributeValues[configurationAttributeKey];
        let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];
        normalized[configurationAttributeKey] = [];
        for (let configurationAttribute of configurationAttributeArray) {
            normalized[configurationAttributeKey].push(normalizeConfigurationAttributeValue(configurationAttribute));
        }
    }    
    return normalized;
}

export function normalizeConfigurationAttributeValue(configurationAttributeValue = {}) {
    let normalized = configurationAttributeValue.normalized ? configurationAttributeValue : Object.assign(defaultConfigurationAttributeValue(), configurationAttributeValue, {
        groups: normalizeConfigurationAttributeGroups(configurationAttributeValue.groups),
        normalized: true,
    });
    return normalized;
}

// ---

export function normalizeNodes(nodes = []) {
    let normalized = [];
    let lastNode = null;
    for (let node of nodes) {
        normalized.push(normalizeNode(node, lastNode));
        lastNode = node;
    }
    return normalized;
}

export function normalizeNode(node = {}) {
    let normalized = node.normalized ? node : Object.assign(defaultNode(), node, {
        table: node.table != null ? node.table.toLowerCase() : node.table,
        children: normalizeNodes(node.children),
        readPerms: normalizePerms(node.readPerms),
        writePerms: normalizePerms(node.writePerms),
        normalized: true,
     });
    return normalized
}

function normalizeConfigurationAttributeGroups(groups = []) {
    let normalized = [];
    for (let group of groups) {
        if (group != null) {
            normalized.push(extendLocalDomain(group));
        }
    }
    return normalized;
}

function normalizeSpecial(special) {
    // exclude toString()
    if (typeof special !== 'function' && special != null) {
        return {
            type: special.type,
            class: special.class,
        };    
    } else {
        return null;
    }
}