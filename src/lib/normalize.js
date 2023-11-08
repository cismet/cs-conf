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
    let normalized = Object.assign({}, configs, {
        config: normalizeConfig(configs.config),
        additionalInfos: normalizeAdditionalInfos(configs.additionalInfos),
        classes: normalizeClasses(configs.classes, configs.config.policies), 
        configurationAttributes: normalizeConfigurationAttributes(configs.configurationAttributes),
        domains: normalizeDomains(configs.domains), 
        dynchildhelpers: normalizeDynchildhelpers(configs.dynchildhelpers),        
        structure: normalizeStructure(configs.structure), 
        usergroups: normalizeUsergroups(configs.usergroups), 
        usermanagement: normalizeUsermanagement(configs.usermanagement), 
    });

    return normalized;
}

export function normalizeConfig(config = {}) {
    let normalized = Object.assign(defaultConfig(), config, {
        connection: normalizeConfigConnection(config.connection),
        sync: normalizeConfigSync(config.sync),
        policies: normalizeConfigPolicies(config.policies),
        policyRules: normalizeConfigPolicyRules(config.policyRules), 
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigConnection(connection = {}) {
    let normalized = Object.assign(defaultConfigConnection(), connection, { 
        normalized: true, 
    });
    return normalized;
}

export function normalizeConfigSync(sync = {}) {
    let normalized = Object.assign(defaultConfigSync(), sync, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigPolicies(policies = {}) {
    let normalized = Object.assign(defaultConfigPolicies(), policies, { 
        normalized: true,
    });
    return normalized;
}

export function normalizeAdditionalInfos(additionalInfos = {}) {
    let normalized = Object.assign(defaultAdditionalInfos(), additionalInfos, { 
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
    let normalized = Object.assign(defaultClass(), clazz, {
        name: clazz.name ?? classKey,
        toString: normalizeSpecial(clazz.toString, classKey),
        editor: normalizeSpecial(clazz.editor, classKey),
        renderer: normalizeSpecial(clazz.renderer, classKey),
        pk: clazz.pk ? clazz.pk.toLowerCase() : defaultClass().pk,
        attributes: normalizeAttributes(clazz.attributes, clazz.pk, classKey),
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

export function normalizeAttributes(attributes = {}, pk = defaultClass().pk, classKey) {
    let normalized = {};

    if (attributes) {
        let pkMissing = true;
        let pkDummy = Object.assign({}, defaultAttribute(), {
            descr: "Primary Key",
            dbType: "INTEGER",
            mandatory: true,
            defaultValue: util.format("nextval('%s_seq')", classKey),
            hidden: true,
            normalized: true,
        });
        for (let attributeKey of Object.keys(attributes)) {
            let attribute = attributes[attributeKey];
            
            if (attribute.cidsType != null) {
                attribute.cidsType = attribute.cidsType.toLowerCase();
            }
            if (attribute.oneToMany != null) {
                attribute.oneToMany = attribute.oneToMany.toLowerCase();
            }
            if (attribute.manyToMany != null) {
                attribute.manyToMany = attribute.manyToMany.toLowerCase();
            }

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw Error(util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", classKey, attributeKey));

            let normalizedAttribute;
            if (pk !== undefined && attributeKey.toLowerCase() == pk.toLowerCase()) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw Error("normalizeAttributes: primary key can only have dbType, no cidsType allowed");
                
                normalizedAttribute = Object.assign({}, pkDummy, attribute, {
                    defaultValue: attribute.defaultValue || util.format("nextval('%s_seq')", classKey),
                    name: attribute.name || attributeKey.toLowerCase(),
                    readPerms: normalizePerms(attribute.readPerms),
                    writePerms: normalizePerms(attribute.writePerms),
                });    
            } else {
                let types = [];
                if (attribute.dbType != null) types.push(attribute.dbType);
                if (attribute.cidsType != null) types.push(attribute.cidsType);
                if (attribute.oneToMany != null) types.push(attribute.oneToMany);
                if (attribute.manyToMany != null) types.push(attribute.manyToMany);

                if (types.length == 0) throw Error(util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", classKey, attributeKey)); 
                if (types.length > 1) throw Error(util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", classKey, attributeKey));

                normalizedAttribute = Object.assign({}, defaultAttribute(), attribute, {
                    name: attribute.name || attributeKey.toLowerCase(),
                    readPerms: normalizePerms(attribute.readPerms),
                    writePerms: normalizePerms(attribute.writePerms),    
                });    
            }
            Object.assign(normalizedAttribute, { normalized: true })
            normalized[attributeKey.toLowerCase()] = normalizedAttribute;
        }
        if (pkMissing) {
            normalized[pk.toLowerCase()] = Object.assign({}, pkDummy, {
                name: pk.toLowerCase(),
            });
        }
    }

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
    let normalized = Object.assign(defaultDomain(), domain, {
        configurationAttributes: normalizeConfigurationAttributeValues(domain.configurationAttributes),
        inspected: normalizeDomainInspected(domain.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeDomainInspected(domainInspected = {}) {
    let normalized = Object.assign(defaultDomainInspected(), domainInspected, { 
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
    let normalized = Object.assign(defaultDynchildhelper(), dynchildhelper, { 
        normalized: true,
    });
    if (normalized.code == null && normalized.code_file == null) throw Error(util.format("normalizeDynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name));
    if (normalized.code != null && normalized.code_file != null) throw Error(util.format("normalizeDynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name));
    return normalized;
}

export function normalizeConfigPolicyRules(policyRules = {}) {
    let normalized = Object.assign(defaultConfigPolicyRules());    
    for (let policyRuleKey of Object.keys(normalized)) {
        let policyRule = policyRules[policyRuleKey];
        normalized[policyRuleKey] = normalizeConfigPolicyRule(policyRuleKey, policyRule);
    }
    return normalized;
}

export function normalizeConfigPolicyRule(policyRuleKey, policyRule = {}) {
    let defaultConfigPolicyRule = defaultConfigPolicyRules()[policyRuleKey]
    let normalized = Object.assign({}, defaultConfigPolicyRule, policyRule, { 
        normalized: true,
    });    
    return normalized;
}

export function normalizeStructure(structure = {}) {
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
    let normalized = Object.assign(defaultUserGroup(), usergroup, {
        configurationAttributes: normalizeConfigurationAttributeValues(usergroup.configurationAttributes),
        inspected: normalizeUsergroupInspected(usergroup.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeUsergroupInspected(usergroupInspected = {}) {
    let normalized = Object.assign(defaultUserGroupInspected(), usergroupInspected, {
        allConfigurationAttributes: normalizeConfigurationAttributeValues(usergroupInspected.allConfigurationAttributes),
        permissions: normalizeUsergroupInspectedPermissions(usergroupInspected.permissions),
        normalized: true,
    });
    return normalized;
}

export function normalizeUsergroupInspectedPermissions(usergroupInspectedPermissions = {}) {
    let normalized = Object.assign(defaultUserGroupInspectedPermissions(), usergroupInspectedPermissions, {
        normalized: true,
    });
    return normalized;
}

export function normalizeUsermanagement(usermanagement = {}) {
    let normalized = {};
    for (let userKey of Object.keys(usermanagement)) {
        let user = usermanagement[userKey];
        normalized[userKey] = normalizeUser(user, userKey);
    }
    return normalized;
}

export function normalizeUser(user = {}, userKey) {
    if (user.pw_hash == null) throw Error(util.format("normalizeUsermanagement: [%s] missing pw_hash", userKey));
    if (user.salt == null) throw Error(util.format("normalizeUsermanagement: [%s] missing salt", userKey));
    if (user.password != null) throw Error(util.format("normalizeUsermanagement: [%s] password not allowed", userKey));

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

    let normalized = Object.assign(defaultUser(), user, {
        shadows,
        groups,
        configurationAttributes,
        inspected: normalizeUserInspected(user.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeUserInspected(userInspected = {}) {
    let normalized = Object.assign(defaultUserInspected(), userInspected, { 
        memberOf: normalizeGroups(userInspected.memberOf),
        shadowMemberOf: normalizeshadowMemberOf(userInspected.shadowMemberOf),
        allConfigurationAttributes: normalizeConfigurationAttributeValues(userInspected.allConfigurationAttributes),
        permissions: normalizeUserInspectedPermissions(userInspected.permissions),
        normalized: true,
    });
    return normalized;
}

export function normalizeUserInspectedPermissions(userInspectedPermissions = {}) {
    let normalized = Object.assign(defaultUserInspectedPermissions(), userInspectedPermissions, {
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
            normalized[configurationAttributeKey] = normalizeConfigurationAtribute(configurationAtribute);
        }
    }
    return normalized;
}

export function normalizeConfigurationAtribute(configurationAttribute = {}) {
    let normalized = Object.assign(defaultConfigurationAttribute(), configurationAttribute, {
        inspected: normalizeConfigurationAttributeInspected(configurationAttribute.inspected),
        normalized: true,
    });
    return normalized;
}

export function normalizeConfigurationAttributeInspected(configurationAttributeInspected = {}) {
    let normalized = Object.assign(defaultConfigurationAttributeInspected(), configurationAttributeInspected, {
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
    let normalized = Object.assign(defaultConfigurationAttributeValue(), configurationAttributeValue, {
        groups: normalizeConfigurationAttributeGroups(configurationAttributeValue.groups),
        normalized: true,
    });
    if (normalized.value != null && normalized.xmlfile != null) throw Error("normalizeConfigurationAttributes: value and xmlfile can't both be set");
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

export function normalizeNode(node = {}, lastNode = {}) {
    let normalized = Object.assign(defaultNode(), node, {
        table: node.table != null ? node.table.toLowerCase() : node.table,
        children: normalizeNodes(node.children),
        readPerms: normalizePerms(node.readPerms),
        writePerms: normalizePerms(node.writePerms),
        normalized: true,
     });

    if (normalized.link == null) {
        if (normalized.name == null) throw Error(util.format("normalizeStructure: missing name for node (the one after %s)", lastNode.name));
        if (normalized.dynamic_children_file != null && normalized.dynamic_children != null) throw Error(util.format("normalizeStructure: [%s] dynamic_children and dynamic_children_file can't both be set", normalized.name));
        //if (normalized.children != null && (normalized.dynamic_children_file != null || nodnormalizede.dynamic_children != null)){ console.table(normalized);  throw Error("children and dynamic_children(_file) can't both be set"});
    }
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

function normalizeSpecial(special, table) {
    // exclude toString()
    if (typeof special !== 'function' && special != null) {
        if (special.type == null) throw Error(util.format("normalizeClasses: [%s] type missing", table));
        if (special.class == null) throw Error(util.format("normalizeClasses: [%s] class missing", table));
        return {
            type: special.type,
            class: special.class,
        };    
    }
    return null;
}