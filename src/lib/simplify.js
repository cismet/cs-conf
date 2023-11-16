import util from "util";

import { removeLocalDomain } from "./tools/cids";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

import { 
    reorganizeConfigs 
} from './reorganize';

import { 
    defaultAttribute, 
    defaultAttributePrimary, 
    defaultClass, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributeValue, 
    defaultDomain, 
    defaultDynchildhelper, 
    defaultUser, 
    defaultUserGroup, 
    defaultNode, 
    defaultUserInspected,
    defaultDomainInspected,
    defaultConfigurationAttribute,
    defaultConfigurationAttributeInspected,
    defaultConfigPolicyRules,
    defaultConfigPolicies,
    defaultUserGroupInspectedPermissions,
    defaultUserInspectedPermissions,
    defaultUserGroupInspected,
    defaultConfigs,
} from "./tools/defaultObjects";

import { 
    normalizeAdditionalInfos, 
    normalizeAttributes, 
    normalizeClasses, 
    normalizeConfig, 
    normalizeConfigurationAttributeValues, 
    normalizeDomains, 
    normalizeDynchildhelpers, 
    normalizeStructure, 
    normalizeUsergroups, 
    normalizeUsermanagement, 
    normalizePerms, 
    normalizeUser,
    normalizeUsergroup,
    normalizeConfigPolicyRule,
    normalizeConfigPolicies,
    normalizeConfigPolicyRules,
    normalizeConfigConnection,
    normalizeConfigSync,
    normalizeDomain,
    normalizeConfigs,
    normalizeDynchildhelper,
    normalizeClass,
    normalizeDomainInspected,
    normalizeNode,
    normalizeUsergroupInspected,
    normalizeUsergroupInspectedPermissions,
    normalizeUserInspected,
    normalizeUserInspectedPermissions,
    normalizeConfigurationAttribute,
    normalizeConfigurationAttributeValue,
    normalizeConfigurationAttributeInspected, 
} from "./normalize";
import { clean } from "./tools/tools";
import stringify from "json-stringify-pretty-compact";

// ---

export default async function csSimplify(options) {
    let { targetDir, reorganize } = options;

    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw Error("config not set");

    configs = reorganize ? reorganizeConfigs(configs) : configs;

    let simplified = simplifyConfigs(configs);
    writeConfigFiles(simplified, targetDir);
    return simplified;
}

// ---

export function simplifyConfigs(configs) {
    if (!configs) return undefined;
    let normalized = normalizeConfigs(configs);

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        config: simplifyConfig(normalized.config), 
        additionalInfos: simplifyAdditionalInfos(normalized.additionalInfos), 
        configurationAttributes: simplifyConfigurationAttributes(normalized.configurationAttributes), 
        domains: simplifyDomains(normalized.domains), 
        usergroups: simplifyUsergroups(normalized.usergroups), 
        usermanagement: simplifyUsermanagement(normalized.usermanagement), 
        classes: simplifyClasses(normalized.classes, normalized.config.policies), 
        dynchildhelpers: simplifyDynchildhelpers(normalized.dynchildhelpers),
        structure: simplifyStructure(normalized.structure, normalized.config.policies), 
    }), defaultConfigs());
    return simplified;
}

export function simplifyConfig(config) {
    if (!config) return undefined;
    let normalized = normalizeConfig(config);

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        connection: simplifyConfigConnection(normalized.connection),
        policies: simplifyConfigPolicies(normalized.policies),
        policyRules: simplifyConfigPolicyRules(normalized.policyRules), 
        sync: simplifyConfigSync(normalized.sync),
        normalized: false,
    }), defaultConfig());

    clean(simplified);
    return Object.keys(simplified).length === 0 ? undefined : simplified;
}

export function simplifyConfigConnection(connection) {
    if (!connection) return undefined;
    let normalized = normalizeConfigConnection(connection)

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        normalized: false,
    }), defaultConfigConnection());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyConfigPolicies(policies) {
    if (!policies) return undefined;
    let normalized = normalizeConfigPolicies(policies)

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        normalized: false,
    }), defaultConfigPolicies());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyConfigSync(sync) {
    if (!sync) return undefined;
    let normalized = normalizeConfigSync(sync)

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        normalized: false,
    }), defaultConfigSync());    

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyAdditionalInfos(additionalInfos) {
    if (!additionalInfos) return undefined;
    let normalized = normalizeAdditionalInfos(additionalInfos);

    let simplified = {};
    for (let type of Object.keys(normalized)) {
        if (normalized[type]) {
            let simplifiedType = {};
            for (let key of Object.keys(normalized[type])) {
                simplifiedType[key] = normalized[type][key];
            }
            delete simplifiedType._unprocessed;
            if (Object.keys(simplifiedType).length) {
                simplified[type] = simplifiedType;
            }
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyClasses(classes, policies) {
    if (!classes) return undefined;
    let normalized = normalizeClasses(classes, policies);

    let simplified = {};
    for (let classKey of Object.keys(normalized)) {
        let clazz = normalized[classKey];
        let simplifiedClazz = simplifyClass(classKey, clazz, policies);
        simplified[classKey] = simplifiedClazz;
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyClass(classKey, clazz, policies) {
    if (!clazz) return undefined;
    let normalized = normalizeClass(classKey, clazz, normalizedPolicies);
    let normalizedPolicies = normalizeConfigPolicies(policies);

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        name: normalized.name == classKey ? undefined : normalized.name,
        icon: normalized.icon == null && normalized.classIcon == normalized.objectIcon ? normalized.classIcon : normalized.icon,
        classIcon: normalized.classIcon == normalized.objectIcon ? undefined : normalized.classIcon,
        objectIcon: normalized.classIcon == normalized.objectIcon ? undefined : normalized.objectIcon,
        readPerms: simplifyPerms(normalized.readPerms), 
        writePerms: simplifyPerms(normalized.writePerms),
        attributes: simplifyAttributes(normalized.attributes, normalized.pk, classKey),
        normalized: false,
    }), Object.assign({}, defaultClass(), normalizedPolicies ? {
        policy : normalizedPolicies.server,
        attribute_policy : normalizedPolicies.attributes ?? normalizedPolicies.server,
    } : undefined));

    clean(simplified);
    return simplified;
}

export function simplifyDomains(domains) {
    if (!domains) return undefined;
    let normalized = normalizeDomains(domains);
    
    let simplified = {};
    for (let domainKey of Object.keys(normalized)) {  
        let domain = normalized[domainKey];
        simplified[domainKey] = simplifyDomain(domain);
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyDomain(domain) {
    if (!domain) return undefined;
    let normalized = normalizeDomain(domain);

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        configurationAttributes: simplifyConfigurationAttributeValues(normalized.configurationAttributes),
        inspected: simplifyDomainInspected(normalized.inspected),
        normalized: false,
    }), defaultDomain());

    clean(simplified);
    return simplified;
}

export function simplifyDomainInspected(domainInspected) {
    if (!domainInspected) return undefined;
    let normalized = normalizeDomainInspected(domainInspected);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        groups: normalized.groups.length ? normalized.groups : undefined,
        normalized: false,
    }), defaultDomainInspected());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyDynchildhelpers(dynchildhelpers) {
    if (!dynchildhelpers) return undefined;
    let normalized = normalizeDynchildhelpers(dynchildhelpers);

    let simplified = {};
    for (let dynchildhelperKey of Object.keys(normalized)) {
        let dynchildhelper = normalized[dynchildhelperKey];
        simplified[dynchildhelperKey] = simplifyDynchildhelper(dynchildhelper);
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyDynchildhelper(dynchildhelper) {
    if (!dynchildhelper) return undefined;
    let normalized = normalizeDynchildhelper(dynchildhelper);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        normalized: false,
    }), defaultDynchildhelper());

    clean(simplified);
    return simplified;
}

export function simplifyConfigPolicyRules(policyRules) {
    if (!policyRules) return undefined;
    let normalized = normalizeConfigPolicyRules(policyRules);

    let simplified = {};
    for (let policyRuleKey of Object.keys(normalized)) {
        let policyRule = normalized[policyRuleKey];
        simplified[policyRuleKey] = simplifyPolicyRule(policyRule, policyRuleKey);
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyPolicyRule(policyRule, policyRuleKey) {
    if (!policyRule) return undefined;
    let normalized = normalizeConfigPolicyRule(policyRule);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        normalized: false,
    }), defaultConfigPolicyRules()[policyRuleKey])

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyStructure(structure, policies) {
    if (!structure) return undefined;
    let normalized = normalizeStructure(structure);

    return simplifyNodes(normalized, policies);
}


export function simplifyUsergroups(usergroups) {
    if (!usergroups) return undefined;
    let normalized = normalizeUsergroups(usergroups);

    let simplified = {};
    for (let groupKey of Object.keys(normalized)) {
        let group = normalized[groupKey];
        if (group != null) {
            simplified[removeLocalDomain(groupKey)] = simplifyUsergroup(group);
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyUsergroup(group) {
    if (!group) return undefined;
    let normalized = normalizeUsergroup(group);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        configurationAttributes: simplifyConfigurationAttributeValues(normalized.configurationAttributes),
        inspected: simplifyUsergroupInspected(normalized.inspected),
        normalized: false,
    }), defaultUserGroup());
    
    clean(simplified);
    return simplified;
}

export function simplifyUsergroupInspected(usergroupInspected) {
    if (!usergroupInspected) return undefined;
    let normalized = normalizeUsergroupInspected(usergroupInspected);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        members: normalized.members.length ? [...normalized.members] : undefined,
        allConfigurationAttributes: simplifyConfigurationAttributeValues(normalized.allConfigurationAttributes),
        permissions: simplifyUsergroupInspectedPermissions(normalized.permissions),
        normalized: false,
    }), defaultUserGroupInspected());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyUsergroupInspectedPermissions(usergroupInspectedPermissions) {
    if (!usergroupInspectedPermissions) return undefined;
    let normalized = normalizeUsergroupInspectedPermissions(usergroupInspectedPermissions);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        canReadClasses: normalized.canReadClasses && normalized.canReadClasses.length ? [...normalized.canReadClasses] : undefined,
        canWriteClasses: normalized.canWriteClasses && normalized.canWriteClasses.length ? [...normalized.canWriteClasses] : undefined,
        canReadAttributes: normalized.canReadAttributes && normalized.canReadAttributes.length ? [...normalized.canReadAttributes] : undefined,
        canWriteAttributes: normalized.canWriteAttributes && normalized.canWriteAttributes.length ? [...normalized.canWriteAttributes] : undefined,
        normalized: false,
    }), defaultUserGroupInspectedPermissions());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyUsermanagement(usermanagement, { removeUnprocessedInfo = true } = {}) {
    if (!usermanagement) return undefined;
    let normalized = normalizeUsermanagement(usermanagement);

    let simplified = {};
    for (let userKey of Object.keys(normalized)) {
        let user = normalized[userKey];

        let simplifiedUser = simplifyUser(user, { removeUnprocessedInfo });
        if (simplifiedUser != null) {
            simplified[userKey] = simplifiedUser;
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyUser(user, { removeUnprocessedInfo = true } = {}) {
    if (!user) return undefined;
    let normalized = normalizeUser(user);

    let additionalInfo = Object.assign({}, normalized.additional_info); 
    if (removeUnprocessedInfo && additionalInfo._unprocessed) {
        delete additionalInfo._unprocessed;
    }

    let simplified =copyFromTemplate(Object.assign({}, normalized, { 
        groups: simplifyGroups(normalized.groups),
        configurationAttributes: simplifyConfigurationAttributeValues(normalized.configurationAttributes),
        additional_info: additionalInfo,
        inspected: simplifyUserInspected(normalized.inspected),
        normalized: false,
    }), defaultUser());

    clean(simplified);
    return simplified;
}

export function simplifyUserInspected(userInspected) {
    if (!userInspected) return undefined;
    let normalized = normalizeUserInspected(userInspected);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        memberOf: simplifyGroups(normalized.memberOf),
        shadowMemberOf: simplifyshadowMemberOf(normalized.shadowMemberOf),
        allConfigurationAttributes: simplifyConfigurationAttributeValues(normalized.allConfigurationAttributes),
        permissions: simplifyUserInspectedPermissions(normalized.permissions),
        normalized: false,
    }), defaultUserInspected());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyUserInspectedPermissions(userInspectedPermissions) {
    if (!userInspectedPermissions) return undefined;
    let normalized = normalizeUserInspectedPermissions(userInspectedPermissions);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        canReadClasses: normalized.canReadClasses.length ? [...normalized.canReadClasses] : undefined,
        canWriteClasses: normalized.canWriteClasses.length ? [...normalized.canWriteClasses] : undefined,
        canReadAttributes: normalized.canReadAttributes.length ? [...normalized.canReadAttributes] : undefined,
        canWriteAttributes: normalized.canWriteAttributes.length ? [...normalized.canWriteAttributes] : undefined,
        normalized: false,
    }), defaultUserInspectedPermissions());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyshadowMemberOf(shadowMemberOf) {
    if (!shadowMemberOf) return undefined;

    let simplified = {};    
    if (shadowMemberOf != null) {    
        for (let shadowKey of Object.keys(shadowMemberOf)) {
            simplified[shadowKey] = simplifyGroups(shadowMemberOf[shadowKey]);
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyGroup(group) {
    let simplified = null;
    if (group != null) {
        simplified = removeLocalDomain(group);
    }
    return simplified;
}

export function simplifyGroups(groups) {
    let simplified = [];
    if (groups != null) {
        for (let group of groups) {
            let simplifiedGroup = simplifyGroup(group);
            if (simplifiedGroup != null) {
                simplified.push(simplifiedGroup);
            }
        }
    }
    return simplified.length ? simplified : undefined;
}

// ---

function simplifyNodes(nodes, policies) {
    if (!nodes) return undefined;

    let simplified = [];
    for (let node of nodes) {
        simplified.push(simplifyNode(node, policies));
    }
    return simplified.length ? simplified : undefined;
}

function simplifyNode(node, policies) {
    if (!node) return undefined;

    let normalized = normalizeNode(node);
    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        readPerms: simplifyPerms(normalized.readPerms),
        writePerms: simplifyPerms(normalized.writePerms),
        children: simplifyNodes(normalized.children),
        normalized: false,
    }), defaultNode());

    clean(simplified);
    return simplified;
}

function simplifyAttributes(attributes, pk = defaultClass().pk, classKey) {
    if (attributes == null) return null;

    let simplified = {};
    for (let attributeKey of Object.keys(attributes)) {
        let attribute = attributes[attributeKey];
        if (attribute != null) {
            let simplifiedAttribute = copyFromTemplate(Object.assign({}, attribute, {
                normalized: false,
            }), defaultAttribute());
            if (pk !== undefined && attributeKey == pk) {
                let simplifiedPkAttribute = copyFromTemplate(Object.assign({}, attribute, {
                    normalized: false,
                }), defaultAttributePrimary(classKey, pk));
                if (simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')", classKey)) {
                    delete simplifiedPkAttribute.defaultValue;
                }
                if (simplifiedAttribute.name == attributeKey) {
                    delete simplifiedAttribute.name;
                }
                if (Object.entries(simplifiedPkAttribute).length) {
                    simplified[pk] = Object.assign(
                        {
                            readPerms: simplifyPerms(attribute.readPerms), 
                            writePerms: simplifyPerms(attribute.writePerms),
                        }, simplifiedPkAttribute
                    );
                }
            } else {
                if (simplifiedAttribute.name == attributeKey) {
                    delete simplifiedAttribute.name;
                }
                clean(simplifiedAttribute)
                if(Object.keys(simplifiedAttribute).length) {
                    simplified[attributeKey] = simplifiedAttribute;
                }
            }
        }
    }
    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

function simplifyPerms(perms) {
    if (perms == null) return null;
    let normalized = normalizePerms(perms);

    let simplified = [];
    for (let perm of normalized) {
        simplified.push(removeLocalDomain(perm));
    }

    return simplified.length ? simplified : undefined;
}

export function simplifyConfigurationAttributes(configurationAttributes) {
    if (!configurationAttributes) return undefined;
    let normalized = normalizeConfigurationAttributeValues(configurationAttributes);

    let simplified = {};
    for (let configurationAttributeKey of Object.keys(normalized)) {
        let configurationAttribute = configurationAttributes[configurationAttributeKey];
        if (configurationAttribute != null) {
            simplified[configurationAttributeKey] = simplifyConfigurationAttribute(configurationAttribute);
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyConfigurationAttribute(configurationAttribute) {
    if (!configurationAttribute) return undefined;
    let normalized = normalizeConfigurationAttribute(configurationAttribute);

    let simplified = copyFromTemplate(Object.assign({}, normalized, {
        inspected: simplifyConfigurationAttributeInspected(normalized.inspected),
        normalized: false,
    }), defaultConfigurationAttribute());

    clean(simplified);
    return simplified;
}

export function simplifyConfigurationAttributeInspected(configurationAttributeInspected) {
    if (!configurationAttributeInspected) return undefined;
    let normalized = normalizeConfigurationAttributeInspected(configurationAttributeInspected);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        domainValues: simplifyConfigurationAttributeValues(normalized.domainValues),
        groupValues: simplifyConfigurationAttributeValues(normalized.groupValues),
        userValues: simplifyConfigurationAttributeValues(normalized.userValues),
        normalized: false,
    }), defaultConfigurationAttributeInspected());

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyConfigurationAttributeValues(configurationAttributeValues) {
    if (!configurationAttributeValues) return undefined;
    let normalized = normalizeConfigurationAttributeValues(configurationAttributeValues);

    let simplified = {};
    for (let configurationAttributeKey of Object.keys(normalized)) {
        let configurationAttributeValue = configurationAttributeValues[configurationAttributeKey];
        let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];

        let simplifiedArray = [];
        for (let configurationAttribute of configurationAttributeArray) {
            if (configurationAttribute != null) {
                simplifiedArray.push(simplifyConfigurationAttributeValue(configurationAttribute));
            }
        }
        if (simplifiedArray.length > 1) {
            simplified[configurationAttributeKey] = simplifiedArray;
        } else if  (simplifiedArray.length == 1) {
            simplified[configurationAttributeKey] = simplifiedArray[0];
        }
    }

    clean(simplified);
    return Object.keys(simplified).length ? simplified : undefined;
}

export function simplifyConfigurationAttributeValue(configurationAttributeValue) {
    if (!configurationAttributeValue) return undefined;
    let normalized = normalizeConfigurationAttributeValue(configurationAttributeValue);

    let simplified = copyFromTemplate(Object.assign({}, normalized, { 
        groups: simplifyConfigurationAttributeGroups(normalized.groups),
        group: normalized.group ? removeLocalDomain(normalized.group) : undefined,
        normalized: false,
    }), defaultConfigurationAttributeValue());

    clean(simplified);
    return simplified;
}

function simplifyConfigurationAttributeGroups(groups) {
    let simplified = [];
    if (groups != null) {
        for (let group of groups) {
            if (group != null) {
                simplified.push(removeLocalDomain(group));
            }
        }
    }
    return simplified.length ? simplified : undefined;
}

export function copyFromTemplate(object, template) {
    let copy = {};

    for (let [key, value] of Object.entries(template)) {
        let check = object[key];
        if (
            check != null && !(
                check == value || 
                (check.constructor === Array && check.length == 0) ||
                (check.constructor === Object && Object.keys(check).length == 0) ||  
                false // does nothing, except allows adding by c&p of the last line with ||
            )
        ) {
            copy[key] = object[key];
        }
    }
    return copy;
}