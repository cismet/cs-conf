import util from "util";

import { removeLocalDomain } from "./tools/cids";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

import { 
    reorganizeConfigs 
} from './reorganize';

import { 
    copyFromTemplate, 
    defaultAttribute, 
    defaultAttributePrimary, 
    defaultClass, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributes, 
    defaultDomain, 
    defaultDynchildhelper, 
    defaultUser, 
    defaultUserGroup, 
    defaultNode, 
    defaultPolicyRule, 
} from "./tools/defaultObjects";

import { 
    normalizeAdditionalInfos, 
    normalizeAttributes, 
    normalizeClasses, 
    normalizeConfig, 
    normalizeConfigurationAttributes, 
    normalizeDomains, 
    normalizeDynchildhelpers, 
    normalizeStructure, 
    normalizeUsergroups, 
    normalizeUsermanagement, 
    normalizePerms, 
    normalizePolicyRules, 
} from "./normalize";

// ---

export default async function csSimplify(options) {
    let { targetDir, reorganize } = options;

    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";
    
    let simplified = simplifyConfigs(reorganize ? reorganizeConfigs(configs) : configs);

    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(simplified, targetDir);
    }
    return simplified;
}

// ---

export function simplifyConfigs(configs) {
    let mainDomain = configs.config.domainName;
    return Object.assign({}, configs, {
        config: simplifyConfig(configs.config), 
        additionalInfos: simplifyAdditionalInfos(configs.additionalInfos), 
        classes: simplifyClasses(configs.classes, mainDomain), 
        domains: simplifyDomains(configs.domains, mainDomain), 
        dynchildhelpers: simplifyDynchildhelpers(configs.dynchildhelpers),
        policyRules: simplifyPolicyRules(configs.policyRules), 
        structure: simplifyStructure(configs.structure, mainDomain), 
        usergroups: simplifyUsergroups(configs.usergroups, mainDomain), 
        usermanagement: simplifyUsermanagement(configs.usermanagement, configs.additionalInfos, mainDomain), 
    });
}

export function simplifyConfig(config) {
    if (config == null) return null;

    let simplified = {};
    let normalized = normalizeConfig(config);
    if (normalized != null) {
        Object.assign(simplified, copyFromTemplate(normalized, defaultConfig), {
            connection: copyFromTemplate(normalized.connection, defaultConfigConnection),
            sync: copyFromTemplate(normalized.sync, defaultConfigSync),
        });
        if (Object.keys(simplified.connection).length === 0) {
            delete simplified.connection;
        }
        if (Object.keys(simplified.sync).length === 0) {
            delete simplified.sync;
        }
    }
    return Object.keys(simplified).length === 0 ? undefined : simplified;
}

export function simplifyAdditionalInfos(additionalInfos) {
    let simplified = {};
    if (additionalInfos) {
        let normalized = normalizeAdditionalInfos(additionalInfos);
        for (let type of Object.keys(normalized)) {
            if (normalized[type]) {
                let simplifiedType = {};
                for (let key of Object.keys(normalized[type])) {
                    simplifiedType[key] = normalized[type][key];
                }
                if (Object.keys(simplifiedType).length > 0) {
                    simplified[type] = simplifiedType;
                }
            }
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyClasses(classes, mainDomain) {
    if (classes == null) return null;

    let normalized = normalizeClasses(classes);

    let simplified = {};
    for (let classKey of Object.keys(normalized)) {
        let clazz = normalized[classKey];
        if (clazz != null) {
            let simplifiedClazz = copyFromTemplate(Object.assign(clazz, {
                icon: clazz.icon == null && clazz.classIcon == clazz.objectIcon ? clazz.classIcon : clazz.icon,
                classIcon: clazz.classIcon == clazz.objectIcon ? undefined : clazz.classIcon,
                objectIcon: clazz.classIcon == clazz.objectIcon ? undefined : clazz.objectIcon,
                readPerms: simplifyPerms(clazz.readPerms, mainDomain), 
                writePerms: simplifyPerms(clazz.writePerms, mainDomain),
                attributes: simplifyAttributes(clazz.attributes, clazz.pk, clazz.table, mainDomain),
            }), defaultClass);
            if (simplifiedClazz.name == simplifiedClazz.table) {
                delete simplifiedClazz.name;
            }
            simplified[classKey] = simplifiedClazz;
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyDomains(domains, mainDomain = null) {
    if (domains == null) return null;

    let simplifiedBeforeLocal = {};
    let simpleMain = null;
    let domainnames = [];
    let normalized = normalizeDomains(domains, mainDomain);
    for (let domainKey of Object.keys(normalized)) {
        let domain = normalized[domainKey];
        if (domain != null) {
            domainnames.push(domainKey);
            if (domainKey == mainDomain && domain.configurationAttributes.length == 0 && domain.comment == null) {
                simpleMain = domain;
            }
            let simplifiedDomain = copyFromTemplate(domain, defaultDomain);
            if (domain.configurationAttributes !== undefined && domain.configurationAttributes.length > 0) {
                simplifiedDomain.configurationAttributes = simplifyConfigurationAttributes(domain.configurationAttributes, mainDomain);
            }
            simplifiedBeforeLocal[domainKey] = simplifiedDomain;
        }
    }
    
    let simplified = {};
    for (let domainKey of Object.keys(simplifiedBeforeLocal)) {  
        let domain = simplifiedBeforeLocal[domainKey];
        if (simpleMain != null) {
            if (domainKey === simpleMain.domainname) {
                continue;
            } else if (domainKey !== "LOCAL") {   
                simplified[domainKey] = domain;
            }
        } else {
            simplified[domainKey] = domain;
        }
    }

    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyDynchildhelpers(dynchildhelpers) {
    if (dynchildhelpers == null) return null;

    let simplified = {};
    let normalized = normalizeDynchildhelpers(dynchildhelpers);
    for (let dynchildhelperKey of Object.keys(normalized)) {
        let dynchildhelper = normalized[dynchildhelperKey];
        if (dynchildhelper != null) {
            simplified[dynchildhelperKey] = copyFromTemplate(dynchildhelper, defaultDynchildhelper);
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyPolicyRules(policyRules) {
    if (policyRules == null) return null;

    let simplified = [];
    for (let policyRule of normalizePolicyRules(policyRules)) {
        if (policyRule != null) {
            simplified.push(copyFromTemplate(policyRule, defaultPolicyRule));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export function simplifyStructure(structure, mainDomain = null) {
    if (structure == null) return null;

    return simplifyNodes(structure, mainDomain);
}


export function simplifyUsergroups(usergroups, mainDomain = null) {
    if (usergroups == null) return null;

    let simplified = {};
    let normalized = normalizeUsergroups(usergroups);
    for (let groupKey of Object.keys(normalized)) {
        let group = normalized[groupKey];
        if (group != null) {
            simplified[removeLocalDomain(groupKey, mainDomain)] = copyFromTemplate(Object.assign({}, group, { 
                configurationAttributes: simplifyConfigurationAttributes(group.configurationAttributes, mainDomain),
            }), defaultUserGroup);
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyUsermanagement(usermanagement, additionalInfos, mainDomain = null) {
    if (usermanagement == null) return null;

    let simplified = {};
    let normalized = normalizeUsermanagement(usermanagement);
    for (let userKey of Object.keys(normalized)) {
        let user = normalized[userKey];
        let simplifiedUser = simplifyUser(user, userKey, additionalInfos, mainDomain);
        if (simplifiedUser != null) {
            simplified[userKey] = simplifiedUser;
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyUser(user, userKey, additionalInfos = {}, mainDomain = null) {
    let simplified = null;
    if (user != null) {
        let additionalInfosUser = additionalInfos.user ?? {};
        let additionalInfo = user.additional_info ?? {};
        let groups = additionalInfo._unshadowed_groups ?? user.groups;
        let configurationAttributes = additionalInfo._unshadowed_configurationAttributes ?? user.configurationAttributes;        
        simplified = copyFromTemplate(Object.assign({}, user, { 
            groups: simplifyGroups(groups, mainDomain),
            configurationAttributes: simplifyConfigurationAttributes(configurationAttributes, mainDomain),
            "configurationAttributes.aggregated": simplifyConfigurationAttributes(user["configurationAttributes.aggregated"], mainDomain),
            "configurationAttributes.domains": user["configurationAttributes.domains"] ? Object.fromEntries(Object.keys(user["configurationAttributes.domains"]).map(key => [key, simplifyConfigurationAttributes(user["configurationAttributes.domains"][key], mainDomain)])) : undefined,
            "configurationAttributes.groups": user["configurationAttributes.groups"] ? Object.fromEntries(Object.keys(user["configurationAttributes.groups"]).map(key => [key, simplifyConfigurationAttributes(user["configurationAttributes.groups"][key], mainDomain)])) : undefined,
            }), defaultUser)
        if (additionalInfo) {
            delete additionalInfo._unshadowed_groups
            delete additionalInfo._unshadowed_configurationAttributes
            if (Object.keys(additionalInfo).length == 0) {
                delete additionalInfosUser[userKey];
            }
        }
    }
    return simplified
}

export function simplifyGroup(group, mainDomain = null) {
    let simplified = null;
    if (group != null) {
        simplified = removeLocalDomain(group, mainDomain);
    }
    return simplified;
}

export function simplifyGroups(groups, mainDomain = null) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            let simplifiedGroup = simplifyGroup(group, mainDomain);
            if (simplifiedGroup != null) {
                simplified.push(simplifiedGroup);
            }
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}

// ---

function simplifyNodes(nodes, mainDomain = null) {
    if (nodes == null) return null;

    let simplified = [];
    for (let node of normalizeStructure(nodes)) {
        if (node != null) {
            simplified.push(copyFromTemplate(Object.assign({}, node, { 
                readPerms: simplifyPerms(node.readPerms, mainDomain),
                writePerms: simplifyPerms(node.writePerms, mainDomain),
                children: simplifyNodes(node.children, mainDomain),
            }), defaultNode));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

function simplifyAttributes(attributes, pk = defaultClass.pk, table, mainDomain) {
    if (attributes == null) return null;

    let simplified = {};

    let normalized = normalizeAttributes(attributes, pk, table);
    for (let attributeKey of Object.keys(normalized)) {
        let attribute = normalized[attributeKey];
        if (attribute != null) {
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (pk !== undefined && attributeKey == pk) {
                let simplifiedPkAttribute = copyFromTemplate(attribute, Object.assign({}, defaultAttributePrimary(table, pk)));
                if (simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')", table)) {
                    delete simplifiedPkAttribute.defaultValue;
                }
                if (simplifiedAttribute.name == attributeKey) {
                    delete simplifiedAttribute.name;
                }
                if (Object.entries(simplifiedPkAttribute).length > 0) {
                    simplified[pk] = Object.assign(
                        {
                            readPerms: simplifyPerms(attribute.readPerms, mainDomain), 
                            writePerms: simplifyPerms(attribute.writePerms, mainDomain),
                        }, simplifiedPkAttribute
                    );
                }
            } else {
                if (simplifiedAttribute.name == attributeKey) {
                    delete simplifiedAttribute.name;
                }
                simplified[attributeKey] = simplifiedAttribute;
            }
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

function simplifyPerms(perms, mainDomain = null) {
    if (perms == null) return null;

    let simplified = [];
    for (let perm of normalizePerms(perms)) {
        simplified.push(removeLocalDomain(perm, mainDomain));
    }
    return simplified.length > 0 ? simplified : undefined;
}

export function simplifyConfigurationAttributes(configurationAttributes, mainDomain = null) {
    if (configurationAttributes == null) return null;

    let simplified = {};
    let normalized = normalizeConfigurationAttributes(configurationAttributes);
    for (let configurationAttributeKey of Object.keys(normalized)) {
        let configurationAttributeValue = configurationAttributes[configurationAttributeKey];
        let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];

        let simplifiedArray = [];
        for (let configurationAttribute of configurationAttributeArray) {
            if (configurationAttribute != null) {
                simplifiedArray.push(copyFromTemplate(Object.assign({}, configurationAttribute, { 
                    groups: simplifyConfigurationAttributeGroups(configurationAttribute.groups, mainDomain) 
                }), defaultConfigurationAttributes));
            }
        }
        if (simplifiedArray.length > 1) {
            simplified[configurationAttributeKey] = simplifiedArray;
        } else if  (simplifiedArray.length == 1) {
            simplified[configurationAttributeKey] = simplifiedArray[0];
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

function simplifyConfigurationAttributeGroups(groups, mainDomain = null) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            simplified.push(removeLocalDomain(group, mainDomain));
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}