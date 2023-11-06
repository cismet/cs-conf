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
    defaultConfigPolicyRule,
    defaultConfigurationAttributeKey,
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
    
    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(normalized, targetDir);
    }
    return normalized;
}

// ---

export function normalizeConfigs(configs) {    
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
    let normalized = Object.assign({}, defaultConfig, config, {
        connection: normalizeConfigConnection(config.connection),
        sync: normalizeConfigSync(config.sync),
        policies: normalizeConfigPolicies(config.policies),
        policyRules: normalizeConfigPolicyRules(config.policyRules), 
    });
    return normalized;
}

export function normalizeConfigConnection(connection) {
    let normalized = Object.assign({}, defaultConfigConnection, connection ?? undefined);
    return normalized;
}

export function normalizeConfigSync(sync) {
    let normalized = Object.assign({}, defaultConfigSync, sync ?? undefined);
    return normalized;
}

export function normalizeConfigPolicies(policies) {
    let normalized = Object.assign({}, defaultConfigPolicies, policies ?? undefined);
    return normalized;
}

export function normalizeAdditionalInfos(additionalInfos) {
    let normalized = Object.assign({}, defaultAdditionalInfos, additionalInfos ?? undefined);
    return normalized;
}

export function normalizeClasses(classes, policies = defaultConfigPolicies) {
    let normalized = {};
    
    if (classes) {
        for (let classKey of Object.keys(classes)) {
            let clazz = classes[classKey];
            let normalizedClass = normalizeClass(classKey, clazz, policies);
            normalized[classKey.toLowerCase()] = normalizedClass;
        }
    }
    return normalized;
}

export function normalizeClass(classKey, clazz, policies = defaultConfigPolicies) {
    let normalized = Object.assign({}, defaultClass);
    if (clazz != null) {
        if (clazz.pk === null) throw Error(util.format("normalizeClasses: [%s] pk of can't be null", classKey));
        //if (clazz.pk !== undefined && clazz.pk !== clazz.pk.toUpperCase()) throw Error(util.format("normalizeClasses: pk '%s' has to be uppercase", clazz.pk));
        //if (clazz.cidsType !== undefined && clazz.cidsType !== clazz.cidsType.toUpperCase()) throw Error(util.format("normalizeClasses: cidsType '%s' has to be uppercase", clazz.cidsType));
        //if (clazz.oneToMany !== undefined && clazz.oneToMany !== clazz.oneToMany.toUpperCase()) throw Error(util.format("normalizeClasses: oneToMany '%s' has to be uppercase", clazz.oneToMany));
        //if (clazz.manyToMany !== undefined && clazz.manyToMany !== clazz.manyToMany.toUpperCase()) throw Error(util.format("normalizeClasses: manyToMany '%s' has to be uppercase", clazz.manyToMany));

        if (clazz.pk != null) {
            clazz.pk = clazz.pk.toLowerCase();
        }            

        return Object.assign(normalized, clazz, {
            name: clazz.name != null ? clazz.name : classKey,
            toString: normalizeSpecial(clazz.toString, classKey),
            editor: normalizeSpecial(clazz.editor, classKey),
            renderer: normalizeSpecial(clazz.renderer, classKey),
            attributes: normalizeAttributes(clazz.attributes, clazz.pk, classKey),
            icon: null,
            policy: clazz.policy ?? policies.server,
            attribute_policy: clazz.attribute_policy ?? policies.attributes,
            classIcon: clazz.classIcon || clazz.icon || null,
            objectIcon: clazz.objectIcon || clazz.icon || null,
            readPerms: normalizePerms(clazz.readPerms),
            writePerms: normalizePerms(clazz.writePerms),
        });
    }
    return normalized;
}

export function normalizeAttributes(attributes, pk = defaultClass.pk, table) {
    let normalized = {};

    if (attributes) {
        let pkMissing = true;
        let pkDummy = Object.assign({}, defaultAttribute, {
            descr: "Primary Key",
            dbType: "INTEGER",
            mandatory: true,
            defaultValue: util.format("nextval('%s_seq')", table),
            hidden: true,
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

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw Error(util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", table, attributeKey));

            if (pk !== undefined && attributeKey.toLowerCase() == pk.toLowerCase()) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw Error("normalizeAttributes: primary key can only have dbType, no cidsType allowed");
                
                normalized[attributeKey.toLowerCase()] = Object.assign({}, pkDummy, attribute, {
                    defaultValue: attribute.defaultValue || util.format("nextval('%s_seq')", table),
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

                if (types.length == 0) throw Error(util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", table, attributeKey)); 
                if (types.length > 1) throw Error(util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", table, attributeKey));

                normalized[attributeKey.toLowerCase()] = Object.assign({}, defaultAttribute, attribute, {
                    name: attribute.name || attributeKey.toLowerCase(),
                    readPerms: normalizePerms(attribute.readPerms),
                    writePerms: normalizePerms(attribute.writePerms),    
                });    
            }
        }
        if (pkMissing) {
            normalized[pk.toLowerCase()] = Object.assign({}, pkDummy, {
                name: pk.toLowerCase(),
            });
        }
    }

    return normalized;
}

export function normalizeDomains(domains) {
    let normalized = {};
    if (domains) {
        for (let domainKey of Object.keys(domains)) {
            if (normalized.hasOwnProperty(domainKey)) throw Error(util.format("normalizeDomains: domain '%s' already exists", domainKey));

            let domain = domains[domainKey];
            normalized[domainKey] = normalizeDomain(domain);
        }
    }
    return normalized;
}

export function normalizeDomain(domain) {
    let normalized = Object.assign({}, defaultDomain);
    if (domain) {
        Object.assign(normalized, domain, {
            configurationAttributes: normalizeConfigurationAttributeValues(domain.configurationAttributes),
            inspected: normalizeDomainInspected(domain.inspected),
        });
    }
    return normalized;
}

export function normalizeDomainInspected(domainInspected) {
    let normalized = Object.assign({}, defaultDomainInspected);
    if (domainInspected) {
        Object.assign(normalized, domainInspected, {
            groups: domainInspected.groups ?? [],
        });
    }
    return normalized;
}

export function normalizeDynchildhelpers(dynchildhelpers) {
    let normalized = {};
    if (dynchildhelpers) {
        for (let dynchildhelperKey of Object.keys(dynchildhelpers)) {
            let dynchildhelper = dynchildhelpers[dynchildhelperKey];
            normalized[dynchildhelperKey] = normalizeDynchildhelper(dynchildhelper);
        }
    }
    return normalized;
}

export function normalizeDynchildhelper(dynchildhelper) {
    let normalized = Object.assign({}, defaultDynchildhelper);
    if (dynchildhelper) {
        if (dynchildhelper.code == null && dynchildhelper.code_file == null) throw Error(util.format("normalizeDynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name));
        if (dynchildhelper.code != null && dynchildhelper.code_file != null) throw Error(util.format("normalizeDynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name));
        Object.assign(normalized, dynchildhelper);
    }
    return normalized;
}

export function normalizeConfigPolicyRules(policyRules) {
    let normalized = Object.assign({}, defaultConfigPolicyRules());    
    if (policyRules) {
        for (let policyRuleKey of Object.keys(policyRules)) {
            let policyRule = policyRules[policyRuleKey];
            normalized[policyRuleKey] = normalizeConfigPolicyRule(policyRule);
        }
    }    
    return normalized;
}

export function normalizeConfigPolicyRule(policyRule) {
    let normalized = Object.assign({}, defaultConfigPolicyRule());    
    if (policyRule) {
        Object.assign(normalized, policyRule)
    }
    return normalized;
}

export function normalizeStructure(structure) {
       return normalizeNodes(structure);
}

export function normalizeUsergroups(usergroups) {
    let normalized = {};
    if (usergroups) {
        for (let groupKey of Object.keys(usergroups)) {
            let usergroup = usergroups[groupKey];
            normalized[extendLocalDomain(groupKey)] = normalizeUsergroup(usergroup);
        }
    }
    return normalized;
}

export function normalizeUsergroup(usergroup) {
    let normalized = Object.assign({}, defaultUserGroup);
    if (usergroup != null) {
        Object.assign(normalized, usergroup, {
            configurationAttributes: normalizeConfigurationAttributeValues(usergroup.configurationAttributes),
            inspected: normalizeUsergroupInspected(usergroup.inspected),
        });
    }
    return normalized;
}

export function normalizeUsergroupInspected(usergroupInspected) {
    let normalized = Object.assign({}, defaultUserGroupInspected, { permissions: defaultUserGroupInspectedPermissions });
    if (usergroupInspected) {
        Object.assign(normalized, usergroupInspected, {
            members: usergroupInspected.members ?? [],
            allConfigurationAttributes: normalizeConfigurationAttributeValues(usergroupInspected.allConfigurationAttributes),
            permissions: normalizeUsergroupInspectedPermissions(usergroupInspected.permissions),
        });
    }
    return normalized;
}

export function normalizeUsergroupInspectedPermissions(usergroupInspectedPermissions) {
    let normalized = Object.assign({}, defaultUserGroupInspectedPermissions);
    if (usergroupInspectedPermissions) {
        Object.assign(normalized, usergroupInspectedPermissions, {
            canReadClasses: usergroupInspectedPermissions.canReadClasses ?? [],
            canWriteClasses: usergroupInspectedPermissions.canWriteClasses ?? [],
            canReadAttributes: usergroupInspectedPermissions.canReadAttributes ?? [],
            canWriteAttributes: usergroupInspectedPermissions.canWriteAttributes ?? [],
        });
    }
    return normalized;
}

export function normalizeUsermanagement(usermanagement) {
    let normalized = {};
    if (usermanagement) {
        for (let userKey of Object.keys(usermanagement)) {
            let user = usermanagement[userKey];
            if (user != null) {
                normalized[userKey] = normalizeUser(user, userKey);
            }
        }
    }
    return normalized;
}

export function normalizeUser(user, userKey) {
    let normalized = Object.assign({}, defaultUser);
    if (user) {
        if (user.pw_hash == null) throw Error(util.format("normalizeUsermanagement: [%s] missing pw_hash", userKey));
        if (user.salt == null) throw Error(util.format("normalizeUsermanagement: [%s] missing salt", userKey));
        if (user.password != null) throw Error(util.format("normalizeUsermanagement: [%s] password not allowed", userKey));

        let shadows = user.shadows ? [...user.shadows] : [];
        let groups = normalizeGroups(user.groups);
        let configurationAttributes = normalizeConfigurationAttributeValues(user.configurationAttributes);

        let additionalInfo = user.additional_info;
        if (additionalInfo) {
            if (additionalInfo._shadow) {
                let _shadow = additionalInfo._shadow
                shadows = _shadow.users;
                groups = _shadow.ownGroups ?? [];
                configurationAttributes = _shadow.ownConfigurationAttributes ?? {};
                // TODO Warn if resulting groups and configuration-Attributes don't match
            }
        }    
        Object.assign(normalized, user, {
            shadows,
            groups,
            configurationAttributes,
            inspected: normalizeUserInspected(user.inspected),
        });
    }
    return normalized;
}

export function normalizeUserInspected(userInspected) {
    let normalized = Object.assign({}, defaultUserInspected, { permissions: defaultUserInspectedPermissions });
    if (userInspected) {
        Object.assign(normalized, userInspected, {
            memberOf: normalizeGroups(userInspected.memberOf),
            shadowMemberOf: normalizeshadowMemberOf(userInspected.shadowMemberOf),
            allConfigurationAttributes: normalizeConfigurationAttributeValues(userInspected.allConfigurationAttributes),
            permissions: normalizeUserInspectedPermissions(userInspected.permissions),
        });
    }
    return normalized;
}

export function normalizeUserInspectedPermissions(userInspectedPermissions) {
    let normalized = Object.assign({}, defaultUserInspectedPermissions);
    if (userInspectedPermissions) {
        Object.assign(normalized, userInspectedPermissions, {
            canReadClasses: userInspectedPermissions.canReadClasses ?? [],
            canWriteClasses: userInspectedPermissions.canWriteClasses ?? [],
            canReadAttributes: userInspectedPermissions.canReadAttributes ?? [],
            canWriteAttributes: userInspectedPermissions.canWriteAttributes ?? [],
        });
    }
    return normalized;
}

export function normalizeshadowMemberOf(shadowMemberOf) {
    let normalized = {};
    if (shadowMemberOf) {
        for (let memberOfShadowKey of Object.keys(shadowMemberOf)) {
            let memberOfShadow = shadowMemberOf[memberOfShadowKey];
            normalized[memberOfShadow] = normalizeGroups(memberOfShadow);
        }
        Object.assign(normalized, shadowMemberOf);
    }
    return normalized;
}

export function normalizeGroups(groups) {
    let normalized = [];
    if (groups) {
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

export function normalizePerms(perms) {
    let normalized = [];
    if (perms) {
        for (let permission of perms) {  
            normalized.push(extendLocalDomain(permission));
        }
    }
    return normalized;
}


export function normalizeConfigurationAttributes(configurationAtributes) {
    let normalized = {};
    if (configurationAtributes) {
        for (let configurationAttributeKey of Object.keys(configurationAtributes)) {
            let configurationAtribute = configurationAtributes[configurationAttributeKey];
            if (configurationAtribute != null) {
                normalized[configurationAttributeKey] = normalizeConfigurationAtributeKey(configurationAtribute, configurationAttributeKey);
            }
        }
    }
    return normalized;
}

export function normalizeConfigurationAtributeKey(configurationAttribute, configurationAttributeKey) {
    let normalized = Object.assign({}, defaultConfigurationAttributeKey);
    if (configurationAttribute) {
        Object.assign(normalized, configurationAttribute, {
            inspected: normalizeConfigurationAttributeInspected(configurationAttribute.inspected),
        });
    }
    return normalized;
}

export function normalizeConfigurationAttributeInspected(configurationAttributeInspected) {
    let normalized = Object.assign({}, defaultConfigurationAttributeInspected);
    if (configurationAttributeInspected) {
        Object.assign(normalized, configurationAttributeInspected, {
            domainValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.domainValues),
            groupValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.groupValues),
            userValues: normalizeConfigurationAttributeInspectedValues(configurationAttributeInspected.userValues),
        });
    }
    return normalized;
}

export function normalizeConfigurationAttributeInspectedValues(configurationAttributeInspectedValues) {
    let normalized = {};
    if (configurationAttributeInspectedValues) {
        for (let configurationAttributeInspectedValueKey of Object.keys(configurationAttributeInspectedValues)) {
            let configurationAttributeInspectedValue = configurationAttributeInspectedValues[configurationAttributeInspectedValueKey];
            normalized[configurationAttributeInspectedValueKey] = configurationAttributeInspectedValue ?? [];
        }
    }
    return normalized;
}



export function normalizeConfigurationAttributeValues(configurationAttributes) {
    let normalized = {};
    if (configurationAttributes) {        
        for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
            let configurationAttributeValue = configurationAttributes[configurationAttributeKey];
            let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];
            normalized[configurationAttributeKey] = [];
            for (let configurationAttribute of configurationAttributeArray) {
                normalized[configurationAttributeKey].push(normalizeConfigurationAttributeValue(configurationAttribute));
            }
        }    
    }
    return normalized;
}

export function normalizeConfigurationAttributeValue(configurationAttribute) {
    let normalized = Object.assign({}, defaultConfigurationAttributeValue);
    if (configurationAttribute) {        
        if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw Error("normalizeConfigurationAttributes: value and xmlfile can't both be set");
        Object.assign(normalized, configurationAttribute, {
            groups: normalizeConfigurationAttributeGroups(configurationAttribute.groups),
        });
    }
    return normalized;
}

// ---

function normalizeNodes(nodes) {
    let normalized = [];
    if (nodes != null) {
        let lastNode = null;
        for (let node of nodes) {
            normalized.push(normalizeNode(node, lastNode));
            lastNode = node;
        }
    }
    return normalized;
}

function normalizeNode(node, lastNode) {
    let normalized = Object.assign({}, defaultNode);
    if (node) {
        if (node.link == null) {
            if (node.name == null) throw Error(util.format("normalizeStructure: missing name for node (the one after %s)", lastNode.name));
            if (node.dynamic_children_file != null && node.dynamic_children != null) throw Error(util.format("normalizeStructure: [%s] dynamic_children and dynamic_children_file can't both be set", node.name));
            //if (node.children != null && (node.dynamic_children_file != null || node.dynamic_children != null)){ console.table(node);  throw Error("children and dynamic_children(_file) can't both be set"});
        }
        Object.assign(normalized, node, {
            table: node.table != null ? node.table.toLowerCase() : node.table,
            children: normalizeNodes(node.children),
            readPerms: normalizePerms(node.readPerms),
            writePerms: normalizePerms(node.writePerms),
        })
    }
    return normalized
}

function normalizeConfigurationAttributeGroups(groups) {
    let normalized = [];
    if (groups != null) {
        for (let group of groups) {
            if (group != null) {
                normalized.push(extendLocalDomain(group));
            }
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