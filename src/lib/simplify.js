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
    normalizeUser,
    normalizeUsergroup, 
} from "./normalize";

// ---

export default async function csSimplify(options) {
    let { targetDir, reorganize } = options;

    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw Error("config not set");
    
    let simplified = simplifyConfigs(reorganize ? reorganizeConfigs(configs) : configs);

    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(simplified, targetDir);
    }
    return simplified;
}

// ---

export function simplifyConfigs(configs) {
    return Object.assign({}, configs, {
        config: simplifyConfig(configs.config), 
        additionalInfos: simplifyAdditionalInfos(configs.additionalInfos), 
        classes: simplifyClasses(configs.classes), 
        domains: simplifyDomains(configs.domains, configs.config.domainName), 
        dynchildhelpers: simplifyDynchildhelpers(configs.dynchildhelpers),
        policyRules: simplifyPolicyRules(configs.policyRules), 
        structure: simplifyStructure(configs.structure), 
        usergroups: simplifyUsergroups(configs.usergroups), 
        usermanagement: simplifyUsermanagement(configs.usermanagement), 
    });
}

export function simplifyConfig(config, { normalize = true } = {}) {
    if (!config) return undefined;

    let preprocessed = normalize ? normalizeConfig(config) : config;

    let simplified = {};
    if (preprocessed) {
        Object.assign(simplified, copyFromTemplate(preprocessed, defaultConfig), {
            connection: copyFromTemplate(preprocessed.connection, defaultConfigConnection),
            sync: copyFromTemplate(preprocessed.sync, defaultConfigSync),
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
                delete simplifiedType._shadow;
                if (Object.keys(simplifiedType).length > 0) {
                    simplified[type] = simplifiedType;
                }
            }
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyClasses(classes) {
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
                readPerms: simplifyPerms(clazz.readPerms), 
                writePerms: simplifyPerms(clazz.writePerms),
                attributes: simplifyAttributes(clazz.attributes, clazz.pk, classKey),
            }), defaultClass);
            if (simplifiedClazz.name == classKey) {
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
    let normalized = normalizeDomains(domains);
    for (let domainKey of Object.keys(normalized)) {
        let domain = normalized[domainKey];
        if (domain != null) {
            domainnames.push(domainKey);
            if (domainKey == mainDomain && domain.configurationAttributes.length == 0 && domain.comment == null) {
                simpleMain = domain;
            }            
            simplifiedBeforeLocal[domainKey] = simplifyDomain(domain);
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

export function simplifyDomain(domain) {
    if (domain == null) return null;
    
    let simplified = copyFromTemplate(Object.assign({}, domain, {
        configurationAttributes: simplifyConfigurationAttributes(domain.configurationAttributes),
    }), defaultDomain);
    return simplified;
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

export function simplifyStructure(structure) {
    if (structure == null) return null;

    return simplifyNodes(structure);
}


export function simplifyUsergroups(usergroups, { normalize = true } = {}) {
    if (!usergroups) return undefined;

    let simplified = {};
    let preprocessed = normalize ? normalizeUsergroups(usergroups) : usergroups;

    for (let groupKey of Object.keys(preprocessed)) {
        let group = preprocessed[groupKey];
        if (group != null) {
            simplified[removeLocalDomain(groupKey)] = simplifyUsergroup(group, { normalize: false });
        }
    }

    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyUsergroup(group, { normalize = false } = {}) {
    if (!group) return undefined;

    let simplified = {};
    let preprocessed = normalize ? normalizeUsergroup(group) : group;

    if (group) {
        Object.assign(simplified, copyFromTemplate(Object.assign({}, preprocessed, { 
            configurationAttributes: simplifyConfigurationAttributes(preprocessed.configurationAttributes),
        }), defaultUserGroup));
    }

    return simplified;
}

export function simplifyUsermanagement(usermanagement, { removeShadowInfo = true, normalize = true } = {}) {
    if (!usermanagement) return undefined;

    let simplified = {};
    let preprocessed = normalize ? normalizeUsermanagement(usermanagement) : usermanagement;

    for (let userKey of Object.keys(preprocessed)) {
        let user = preprocessed[userKey];

        let simplifiedUser = simplifyUser(user, { removeShadowInfo, normalize: false});
        if (simplifiedUser != null) {
            simplified[userKey] = simplifiedUser;
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export function simplifyUser(user, { removeShadowInfo = true, normalize = true } = {}) {
    if (!user) return undefined;

    let simplified = null;    
    let preprocessed = normalize ? normalizeUser(user) : user;

    if (preprocessed != null) {    
        let groups = [...preprocessed.groups];
        let configurationAttributes = Object.assign({}, preprocessed.configurationAttributes);        
        let additionalInfo = Object.assign({}, preprocessed.additional_info); 
        if (removeShadowInfo && additionalInfo._shadow) {
            delete additionalInfo._shadow;
        }

        simplified = copyFromTemplate(Object.assign({}, preprocessed, { 
            groups: simplifyGroups(groups),
            configurationAttributes: simplifyConfigurationAttributes(configurationAttributes),
            additional_info: additionalInfo,
        }), defaultUser);
    }
    
    return simplified;
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

    return simplified.length > 0 ? simplified : undefined;
}

// ---

function simplifyNodes(nodes) {
    if (nodes == null) return null;

    let simplified = [];
    for (let node of normalizeStructure(nodes)) {
        if (node != null) {
            simplified.push(copyFromTemplate(Object.assign({}, node, { 
                readPerms: simplifyPerms(node.readPerms),
                writePerms: simplifyPerms(node.writePerms),
                children: simplifyNodes(node.children),
            }), defaultNode));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

function simplifyAttributes(attributes, pk = defaultClass.pk, classKey) {
    if (attributes == null) return null;

    let simplified = {};

    let normalized = normalizeAttributes(attributes, pk, classKey);
    for (let attributeKey of Object.keys(normalized)) {
        let attribute = normalized[attributeKey];
        if (attribute != null) {
            let simplifiedAttribute = copyFromTemplate(attribute, defaultAttribute);
            if (pk !== undefined && attributeKey == pk) {
                let simplifiedPkAttribute = copyFromTemplate(attribute, Object.assign({}, defaultAttributePrimary(classKey, pk)));
                if (simplifiedPkAttribute.defaultValue == util.format("nextval('%s_seq')", classKey)) {
                    delete simplifiedPkAttribute.defaultValue;
                }
                if (simplifiedAttribute.name == attributeKey) {
                    delete simplifiedAttribute.name;
                }
                if (Object.entries(simplifiedPkAttribute).length > 0) {
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
                simplified[attributeKey] = simplifiedAttribute;
            }
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

function simplifyPerms(perms) {
    if (perms == null) return null;

    let simplified = [];
    for (let perm of normalizePerms(perms)) {
        simplified.push(removeLocalDomain(perm));
    }
    return simplified.length > 0 ? simplified : undefined;
}

export function simplifyConfigurationAttributes(configurationAttributes) {
    if (configurationAttributes == null) return null;

    let simplified = {};
    let normalized = normalizeConfigurationAttributes(configurationAttributes);

    for (let configurationAttributeKey of Object.keys(normalized)) {
        let configurationAttributeValue = configurationAttributes[configurationAttributeKey];
        let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [configurationAttributeValue];

        let simplifiedArray = [];
        for (let configurationAttribute of configurationAttributeArray) {
            if (configurationAttribute != null) {
                simplifiedArray.push(simplifyConfigurationAttribute(configurationAttribute));
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

export function simplifyConfigurationAttribute(configurationAttribute) {
    if (configurationAttribute == null) return null;
    let simplified = copyFromTemplate(Object.assign({}, configurationAttribute, { 
        groups: simplifyConfigurationAttributeGroups(configurationAttribute.groups),
        _group: configurationAttribute._group ? removeLocalDomain(configurationAttribute._group) : undefined,
    }), defaultConfigurationAttributes);
    return simplified;
}

function simplifyConfigurationAttributeGroups(groups) {
    let simplified = [];

    if (groups != null) {
        for (let group of groups) {
            simplified.push(removeLocalDomain(group));
        }
    }

    return simplified.length > 0 ? simplified : undefined;
}