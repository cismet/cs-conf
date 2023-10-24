import util from "util";

import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain } from "./tools/cids";
import { topologicalSort } from "./tools/tools";

import { 
    defaultAdditionalInfos, 
    defaultAttribute, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributes, 
    defaultClass, 
    defaultDomain, 
    defaultDynchildhelper, 
    defaultNode, 
    defaultUser, 
    defaultUserGroup, 
    defaultPolicyRule, 
} from "./tools/defaultObjects";

// ---

export default async function csNormalize(options) {
    let { targetDir } = options;
    let configs = readConfigFiles(global.configsDir);
    if (configs == null) throw "config not set";

    let normalized = normalizeConfigs(configs);
    
    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(normalized, targetDir);
    }
    return normalized;
}

// ---

export function normalizeConfigs(configs) {    
    return Object.assign({}, configs, {
        config: normalizeConfig(configs.config),
        additionalInfos: normalizeAdditionalInfos(configs.additionalInfos),
        classes: normalizeClasses(configs.classes), 
        configurationAttributes: normalizeConfigurationAttributes(configs.configurationAttributes),
        domains: normalizeDomains(configs.domains, configs.config.domainName), 
        dynchildhelpers: normalizeDynchildhelpers(configs.dynchildhelpers),
        policyRules: normalizePolicyRules(configs.policyRules), 
        structure: normalizeStructure(configs.structure), 
        usergroups: normalizeUsergroups(configs.usergroups), 
        usermanagement: normalizeUsermanagement(configs.usermanagement, configs.additionalInfos), 
    });
}

export function normalizeConfig(config = {}) {
    let normalized = Object.assign({}, defaultConfig, config, {
        connection: Object.assign({}, defaultConfigConnection, config.connection),
        sync: Object.assign({}, defaultConfigSync, config.sync),
    });
    return normalized;
}

export function normalizeAdditionalInfos(additionalInfos) {
    let normalized = {};
    
    if (additionalInfos) {
        Object.assign(normalized, defaultAdditionalInfos, additionalInfos);
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
    if (clazz.pk === null) throw util.format("normalizeClasses: [%s] pk of can't be null", classKey);
    //if (clazz.pk !== undefined && clazz.pk !== clazz.pk.toUpperCase()) throw util.format("normalizeClasses: pk '%s' has to be uppercase", clazz.pk);
    //if (clazz.cidsType !== undefined && clazz.cidsType !== clazz.cidsType.toUpperCase()) throw util.format("normalizeClasses: cidsType '%s' has to be uppercase", clazz.cidsType);
    //if (clazz.oneToMany !== undefined && clazz.oneToMany !== clazz.oneToMany.toUpperCase()) throw util.format("normalizeClasses: oneToMany '%s' has to be uppercase", clazz.oneToMany);
    //if (clazz.manyToMany !== undefined && clazz.manyToMany !== clazz.manyToMany.toUpperCase()) throw util.format("normalizeClasses: manyToMany '%s' has to be uppercase", clazz.manyToMany);

    if (clazz.pk != null) {
        clazz.pk = clazz.pk.toLowerCase();
    }            

    return Object.assign({}, defaultClass, clazz, {
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

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", table, attributeKey);

            if (pk !== undefined && attributeKey.toLowerCase() == pk.toLowerCase()) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw "normalizeAttributes: primary key can only have dbType, no cidsType allowed";
                
                normalized[attributeKey.toLowerCase()] = Object.assign({}, pkDummy, attribute, {
                    defaultValue: attribute.defaultValue || util.format("nextval('%s_seq')", table),
                    name: attribute.name || attributeKey.toLowerCase(),
                });    
            } else {
                let types = [];
                if (attribute.dbType != null) types.push(attribute.dbType);
                if (attribute.cidsType != null) types.push(attribute.cidsType);
                if (attribute.oneToMany != null) types.push(attribute.oneToMany);
                if (attribute.manyToMany != null) types.push(attribute.manyToMany);

                if (types.length == 0) throw util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", table, attributeKey);    
                if (types.length > 1) throw util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", table, attributeKey);    

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

export function normalizeDomains(domains, mainDomain) {
    let normalized = {};

    if (domains) {
        for (let domainKey of Object.keys(domains)) {
            if (domainKey == mainDomain) continue;

            let domain = domains[domainKey];
            if (normalized.hasOwnProperty(domainKey)) throw util.format("normalizeDomains: domain '%s' already exists", domainKey);

            normalized[domainKey] = Object.assign({}, defaultDomain, domain, {
                configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
            });
        }
    }

    return normalized;
}

export function normalizeDynchildhelpers(dynchildhelpers) {
    let normalized = {};

    if (dynchildhelpers) {
        for (let dynchildhelperKey of Object.keys(dynchildhelpers)) {
            let dynchildhelper = dynchildhelpers[dynchildhelperKey];

            if (dynchildhelper.code == null && dynchildhelper.code_file == null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name);
            if (dynchildhelper.code != null && dynchildhelper.code_file != null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name);

            normalized[dynchildhelperKey] = Object.assign({}, defaultDynchildhelper, dynchildhelper);
        }
    }

    return normalized;
}

export function normalizePolicyRules(policyRules) {
    let normalized = [];
    
    if (policyRules) {
        for (let policyRule of policyRules) {
            if (policyRule.policy == null) throw "normalizePolicyRules: missing policy";
            if (policyRule.permission == null) throw "normalizePolicyRules: missing permission";
            if (policyRule.default_value == null) throw "normalizePolicyRules: missing default_value";
            
            normalized.push(Object.assign({}, defaultPolicyRule, policyRule));
        }
    }
    
    return normalized;
}

export function normalizeStructure(structure) {
       return normalizeNode(structure);
}

export function normalizeUsergroups(usergroups) {
    let normalized = {};

    if (usergroups) {
        for (let groupKey of Object.keys(usergroups)) {
            let usergroup = usergroups[groupKey];

            normalized[extendLocalDomain(groupKey)] = Object.assign({}, defaultUserGroup, usergroup, {
                configurationAttributes: normalizeConfigurationAttributes(usergroup.configurationAttributes),
            });
        }
    }

    return normalized;
}

export function normalizeUsermanagement(usermanagement, additionalInfos = {}) {
    let normalized = {};
    
    if (usermanagement) {
        for (let userKey of Object.keys(usermanagement)) {
            let user = usermanagement[userKey];
            if (user != null) {
                normalized[userKey] = normalizeUser(user, userKey);
            }
        }
    }

    let shadowDependencyGraph = Object.keys(normalized).reduce((graphed, userKey) => (graphed[userKey] = normalized[userKey].shadows, graphed), {});           
    let dependencySortedUsers = topologicalSort(shadowDependencyGraph);

    for (let userKey of dependencySortedUsers) {
        unshadow(userKey, normalized, additionalInfos);        
    }

    return normalized;
}

export function normalizeUser(user, userKey) {
    if (user.pw_hash == null) throw util.format("normalizeUsermanagement: [%s] missing pw_hash", userKey);
    if (user.salt == null) throw util.format("normalizeUsermanagement: [%s] missing salt", userKey);
    if (user.password != null) throw util.format("normalizeUsermanagement: [%s] password not allowed", userKey);

    let normalized = Object.assign({}, defaultUser, user, {
        groups: normalizeGroups(user.groups),
        configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
    });

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
                if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw "normalizeConfigurationAttributes: value and xmlfile can't both be set";

                normalized[configurationAttributeKey].push(Object.assign({}, defaultConfigurationAttributes, configurationAttribute, {
                    groups: normalizeConfigurationAttributeGroups(configurationAttribute.groups),
                }));
            }
        }    
    }

    return normalized;
}

// ---

function normalizeNode(nodes) {
    let normalized = [];

    if (nodes != null) {
        let lastNode = null;
        for (let node of nodes) {
            if (node.link == null) {
                if (node.name == null) throw util.format("normalizeStructure: missing name for node (the one after %s)", lastNode.name);
                if (node.dynamic_children_file != null && node.dynamic_children != null) throw util.format("normalizeStructure: [%s] dynamic_children and dynamic_children_file can't both be set", node.name);
                //if (node.children != null && (node.dynamic_children_file != null || node.dynamic_children != null)){ console.table(node);  throw "children and dynamic_children(_file) can't both be set"};
            }

            normalized.push(Object.assign({}, defaultNode, node, {
                table: node.table != null ? node.table.toLowerCase() : node.table,
                children: normalizeNode(node.children),
                readPerms: normalizePerms(node.readPerms),
                writePerms: normalizePerms(node.writePerms),
            }));
            lastNode = node;
        }
    }

    return normalized;
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
        if (special.type == null) throw util.format("normalizeClasses: [%s] type missing", table);
        if (special.class == null) throw util.format("normalizeClasses: [%s] class missing", table);
        return {
            type: special.type,
            class: special.class,
        };    
    }
    return null;
}

function unshadow(userKey, usermanagement) {      
    let user = usermanagement[userKey];
    if (user != null && user.shadows != null) {
        let shadows = user.shadows;
        if (shadows.length > 0) {
            let additionalInfo = user.additional_info;
            if (!additionalInfo._unshadowed_groups) {
                additionalInfo._unshadowed_groups = user.groups;
                for (let shadowKey of [...shadows].reverse()) {
                    let shadow = usermanagement[shadowKey];
                    if (shadow != null) {
                        if (shadow.groups != null) {
                            user.groups = [...new Set([...shadow.groups, ...user.groups])];
                        }
                    }
                }            
            }
            if (!additionalInfo._unshadowed_configurationAttributes) {
                for (let shadowKey of shadows) {
                    additionalInfo._unshadowed_configurationAttributes = user.configurationAttributes;
                    let shadow = usermanagement[shadowKey];
                    if (shadow != null) {
                        if (shadow.configurationAttributes != null) {
                            user.configurationAttributes = [...new Set([...shadow.configurationAttributes, ...user.configurationAttributes])];
                        }
                    }
                }
            }            
        }
    }
}