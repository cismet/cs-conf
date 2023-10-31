import util from "util";

import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain } from "./tools/cids";

import { 
    defaultAdditionalInfos, 
    defaultAttribute, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributes, 
    defaultClass, 
    defaultDomain, 
    defaultDomainInspected, 
    defaultDynchildhelper, 
    defaultNode, 
    defaultUser, 
    defaultUserInspected,
    defaultUserGroup, 
    defaultUserGroupInspected,
    defaultPolicyRule,
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
        classes: normalizeClasses(configs.classes), 
        configurationAttributes: normalizeConfigurationAttributes(configs.configurationAttributes),
        domains: normalizeDomains(configs.domains), 
        dynchildhelpers: normalizeDynchildhelpers(configs.dynchildhelpers),
        policyRules: normalizePolicyRules(configs.policyRules), 
        structure: normalizeStructure(configs.structure), 
        usergroups: normalizeUsergroups(configs.usergroups), 
        usermanagement: normalizeUsermanagement(configs.usermanagement), 
    });

    return normalized;
}

export function normalizeConfig(config = {}) {
    let normalized = Object.assign({}, defaultConfig, {
        connection: Object.assign({}, defaultConfigConnection),
        sync: Object.assign({}, defaultConfigSync),
    });
    if (config) {
        Object.assign(normalized, config, {
            connection: Object.assign(normalized.connection, config.connection),
            sync: Object.assign(normalized.sync, config.sync),
        });
    }
    return normalized;
}

export function normalizeAdditionalInfos(additionalInfos) {
    let normalized = Object.assign({}, defaultAdditionalInfos);
    
    if (additionalInfos) {
        Object.assign(normalized, additionalInfos);
    }
    
    return normalized;
}

export function normalizeClasses(classes) {
    let normalized = {};
    
    if (classes) {
        for (let classKey of Object.keys(classes)) {
            let clazz = classes[classKey];
            let normalizedClass = normalizeClass(classKey, clazz);
            normalized[classKey.toLowerCase()] = normalizedClass;
        }
    }
    return normalized;
}

export function normalizeClass(classKey, clazz) {
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
            configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes),
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

export function normalizePolicyRules(policyRules) {
    let normalized = [];
    if (policyRules) {
        for (let policyRule of policyRules) {           
            normalized.push(normalizePolicyRule(policyRule));
        }
    }    
    return normalized;
}

export function normalizePolicyRule(policyRule) {
    let normalized = Object.assign({}, defaultPolicyRule);    
    if (policyRule) {
        if (policyRule.policy == null) throw Error("normalizePolicyRules: missing policy");
        if (policyRule.permission == null) throw Error("normalizePolicyRules: missing permission");
        if (policyRule.default_value == null) throw Error("normalizePolicyRules: missing default_value");
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
            configurationAttributes: normalizeConfigurationAttributes(usergroup.configurationAttributes),
            inspected: normalizeUsergroupInspected(usergroup.inspected),
        });
    }
    return normalized;
}

export function normalizeUsergroupInspected(usergroupInspected) {
    let normalized = Object.assign({}, defaultUserGroupInspected);
    if (usergroupInspected) {
        Object.assign(normalized, usergroupInspected, {
            members: usergroupInspected.members ?? [],
            canReadClasses: usergroupInspected.canReadClasses ?? [],
            canWriteClasses: usergroupInspected.canWriteClasses ?? [],
            canReadAttributes: usergroupInspected.canReadAttributes ?? [],
            canWriteAttributes: usergroupInspected.canWriteAttributes ?? [],
            allConfigurationAttributes: normalizeConfigurationAttributes(usergroupInspected.allConfigurationAttributes),
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
        let configurationAttributes = normalizeConfigurationAttributes(user.configurationAttributes);

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
    let normalized = Object.assign({}, defaultUserInspected);
    if (userInspected) {
        Object.assign(normalized, userInspected, {
            memberOf: normalizeGroups(userInspected.memberOf),
            shadowMemberOf: normalizeshadowMemberOf(userInspected.shadowMemberOf),
            canReadClasses: userInspected.canReadClasses ?? [],
            canWriteClasses: userInspected.canWriteClasses ?? [],
            canReadAttributes: userInspected.canReadAttributes ?? [],
            canWriteAttributes: userInspected.canWriteAttributes ?? [],
            allConfigurationAttributes: normalizeConfigurationAttributes(userInspected.allConfigurationAttributes),
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

export function normalizeConfigurationAttributes(configurationAttributes) {
    let normalized = {};
    if (configurationAttributes) {        
        for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
            let configurationAttributeValue = configurationAttributes[configurationAttributeKey];
            let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];
            normalized[configurationAttributeKey] = [];
            for (let configurationAttribute of configurationAttributeArray) {
                normalized[configurationAttributeKey].push(normalizeConfigurationAttribute(configurationAttribute));
            }
        }    
    }
    return normalized;
}

export function normalizeConfigurationAttribute(configurationAttribute) {
    let normalized = Object.assign({}, defaultConfigurationAttributes);
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