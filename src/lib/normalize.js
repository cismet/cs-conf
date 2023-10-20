import util from "util";

import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain } from "./tools/cids";
import { topologicalSort } from "./tools/tools";

import { 
    defaultAdditionalInfos, 
    defaultAttribute, 
    defaultAttrPerm, 
    defaultConfig, 
    defaultConfigConnection, 
    defaultConfigSync, 
    defaultConfigurationAttributes, 
    defaultClass, 
    defaultClassPerm, 
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
        attrPerms: normalizeAttrPerms(configs.attrPerms), 
        classes: normalizeClasses(configs.classes), 
        classPerms: normalizeClassPerms(configs.classPerms), 
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

export function normalizeAttrPerms(attrPerms) {
    let normalized = [];
    
    if (attrPerms != null) {
        for (let attrPerm of attrPerms) {
            if (attrPerm.key == null) throw "normalizeAttrPerms: missing key";

            normalized.push(Object.assign({}, defaultAttrPerm, attrPerm, {
                key: attrPerm.key.toLowerCase(),
                read: normalizePerms(attrPerm.read),
                write: normalizePerms(attrPerm.write),
            }));
        }
    }
    
    return normalized;
}

export function normalizeClasses(classes) {
    let normalized = [];
    
    if (classes != null) {
        for (let clazz of classes) {
            let normalizedClass = normalizeClass(clazz);
            normalized.push(normalizedClass);                
        }
    }
    return normalized;
}

export function normalizeClass(clazz) {
    if (clazz.table == null) throw "normalizeClasses: missing table for class";
    //if (clazz.table !== clazz.table.toUpperCase()) throw util.format("normalizeClasses: table '%s' has to be uppercase", clazz.table);
    if (clazz.pk === null) throw util.format("normalizeClasses: [%s] pk of can't be null", clazz.table);
    //if (clazz.pk !== undefined && clazz.pk !== clazz.pk.toUpperCase()) throw util.format("normalizeClasses: pk '%s' has to be uppercase", clazz.pk);
    //if (clazz.cidsType !== undefined && clazz.cidsType !== clazz.cidsType.toUpperCase()) throw util.format("normalizeClasses: cidsType '%s' has to be uppercase", clazz.cidsType);
    //if (clazz.oneToMany !== undefined && clazz.oneToMany !== clazz.oneToMany.toUpperCase()) throw util.format("normalizeClasses: oneToMany '%s' has to be uppercase", clazz.oneToMany);
    //if (clazz.manyToMany !== undefined && clazz.manyToMany !== clazz.manyToMany.toUpperCase()) throw util.format("normalizeClasses: manyToMany '%s' has to be uppercase", clazz.manyToMany);

    if (clazz.table != null) {
        clazz.table = clazz.table.toLowerCase();
    }            
    if (clazz.pk != null) {
        clazz.pk = clazz.pk.toLowerCase();
    }            

    return Object.assign({}, defaultClass, clazz, {
        name: clazz.name != null ? clazz.name : clazz.table,
        toString: normalizeSpecial(clazz.toString, clazz.table),
        editor: normalizeSpecial(clazz.editor, clazz.table),
        renderer: normalizeSpecial(clazz.renderer, clazz.table),
        attributes: normalizeAttributes(clazz.attributes, clazz.pk, clazz.table),
        icon: null,
        classIcon: clazz.classIcon || clazz.icon || null,
        objectIcon: clazz.objectIcon || clazz.icon || null,
    });
}

export function normalizeAttributes(attributes, pk = defaultClass.pk, table) {
    let normalized = [];

    if (attributes != null) {
        let pkMissing = true;
        let pkDummy = Object.assign({}, defaultAttribute, {
            descr: "Primary Key",
            dbType: "INTEGER",
            mandatory: true,
            defaultValue: util.format("nextval('%s_seq')", table),
            hidden: true,
        });
        for (let attribute of attributes) {
            if (attribute.field == null) throw util.format("normalizeAttributes: [%s] missing field for attribute", table);

            if (attribute.field != null) {
                attribute.field = attribute.field.toLowerCase();
            }
            if (attribute.cidsType != null) {
                attribute.cidsType = attribute.cidsType.toLowerCase();
            }
            if (attribute.oneToMany != null) {
                attribute.oneToMany = attribute.oneToMany.toLowerCase();
            }
            if (attribute.manyToMany != null) {
                attribute.manyToMany = attribute.manyToMany.toLowerCase();
            }

            if (attribute.dbType == null && (attribute.precision != null || attribute.scale != null)) throw util.format("normalizeAttributes: [%s.%s] precision and scale can only be set if dbType is set", table, attribute.field);

            if (pk !== undefined && attribute.field == pk) {
                pkMissing = false;
                if (
                    attribute.cidsType != null ||
                    attribute.oneToMany != null ||
                    attribute.manyToMany != null                
                ) throw "normalizeAttributes: primary key can only have dbType, no cidsType allowed";
                
                normalized.push(Object.assign({}, pkDummy, attribute, {
                    defaultValue: attribute.defaultValue || util.format("nextval('%s_seq')", table),
                    name: attribute.name || attribute.field,
                }));    
            } else {
                let types = [];
                if (attribute.dbType != null) types.push(attribute.dbType);
                if (attribute.cidsType != null) types.push(attribute.cidsType);
                if (attribute.oneToMany != null) types.push(attribute.oneToMany);
                if (attribute.manyToMany != null) types.push(attribute.manyToMany);

                if (types.length == 0) throw util.format("normalizeAttributes: [%s.%s] either dbType or cidsType or oneToMany or manyToMany missing", table, attribute.field);    
                if (types.length > 1) throw util.format("normalizeAttributes: [%s.%s] type has to be either dbType or cidsType or oneToMany or manyToMany", table, attribute.field);    

                normalized.push(Object.assign({}, defaultAttribute, attribute, {
                    name: attribute.name || attribute.field,
                }));    
            }
        }
        if (pkMissing) {
            normalized.unshift(Object.assign({}, pkDummy, {
                field: pk,
                name: pk,
            }));
        }
    }

    return normalized;
}

export function normalizeClassPerms(classPerms) {
    let normalized = [];
    
    if (classPerms != null) {
        for (let classPerm of classPerms) {
            if (classPerm.table == null) throw "normalizeClassPerms: missing table for classPerm";

            normalized.push(Object.assign({}, defaultClassPerm, classPerm, {
                table: classPerm.table.toLowerCase(),
                read: normalizePerms(classPerm.read),
                write: normalizePerms(classPerm.write),
            }));
        }
    }

    return normalized;
}

export function normalizeDomains(domains, mainDomain) {
    let normalized = [];

    if (domains != null) {
        let localDomain = null;
        let domainnames = [];
        for (let domain of domains) {
            if (domain.domainname == null) throw "normalizeDomains: missing domainname";
            if (domainnames.includes(domain.domainname)) throw util.format("normalizeDomains: domain '%s' already exists", domain.domainname);

            if (domain.domainname == mainDomain || domains.length == 1) {
                if (localDomain != null) {
                    throw util.format("normalizeDomains: can't set %s as main, %s is already main", domain.domainname, localDomain.domainname);
                }
                localDomain = domain;
            } else {
                domainnames.push(domain.domainname);
                normalized.push(Object.assign({}, defaultDomain, domain, {
                    configurationAttributes: normalizeConfigurationAttributes(domain.configurationAttributes)
                }));
    
            }
        }

        if (localDomain != null) {
            if (!domainnames.includes("LOCAL")) {
                normalized.push(Object.assign({}, defaultDomain, localDomain, { domainname: "LOCAL" }, {
                    configurationAttributes: normalizeConfigurationAttributes(localDomain.configurationAttributes)
                }));    
            }

            if (!domainnames.includes(localDomain.domainname)) {
                normalized.push(Object.assign({}, defaultDomain, { domainname: localDomain.domainname }));            
            }
        }
    }

    return normalized;
}

export function normalizeDynchildhelpers(dynchildhelpers) {
    let normalized = [];

    if (dynchildhelpers != null) {
        for (let dynchildhelper of dynchildhelpers) {
            if (dynchildhelper.name == null) throw "normalizeDynchildhelpers: name missing";
            if (dynchildhelper.code == null && dynchildhelper.code_file == null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name);
            if (dynchildhelper.code != null && dynchildhelper.code_file != null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name);

            normalized.push(Object.assign({}, defaultDynchildhelper, dynchildhelper));
        }
    }

    return normalized;
}

export function normalizePolicyRules(policyRules) {
    let normalized = [];
    
    if (policyRules != null) {
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
    let normalized = [];

    if (usergroups != null) {
        for (let usergroup of usergroups) {
            if (usergroup.key == null) throw "normalizeUsergroups: missing key";

            normalized.push(Object.assign({}, defaultUserGroup, usergroup, {
                key: extendLocalDomain(usergroup.key),
                configurationAttributes: normalizeConfigurationAttributes(usergroup.configurationAttributes),
            }));
        }
    }

    return normalized;
}

export function normalizeUsermanagement(usermanagement, additionalInfos = {}) {
    let normalized = [];

    let usersMap = new Map();
    
    for (let user of usermanagement) {
        if (user != null) {
            let userKey = user.login_name;
            if (userKey == null) throw "normalizeUsermanagement: missing login_name";

            let normalizedUser = normalizeUser(user);
            usersMap.set(userKey, normalizedUser);
            normalized.push(normalizedUser);
        }
    }

    let shadowDependencyGraph = normalized.reduce((graphed, user) => (graphed[user.login_name] = user.shadows, graphed), {});           
    let dependencySortedUsers = topologicalSort(shadowDependencyGraph);

    for (let userKey of dependencySortedUsers) {
        unshadow(userKey, usersMap, additionalInfos);        
    }

    return normalized;
}

export function normalizeUser(user) {
    if (user.pw_hash == null) throw util.format("normalizeUsermanagement: [%s] missing pw_hash", user.login_name);
    if (user.salt == null) throw util.format("normalizeUsermanagement: [%s] missing salt", user.login_name);
    if (user.password != null) throw util.format("normalizeUsermanagement: [%s] password not allowed", user.login_name);

    let normalized = Object.assign({}, defaultUser, user, {
        groups: normalizeGroups(user.groups),
        configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
    });

    return normalized;
}

export function normalizeGroups(groups) {
    let normalized = [];

    if (groups != null) {
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
    
    if (perms != null) {
        for (let permission of perms) {  
            normalized.push(extendLocalDomain(permission));
        }
    }

    return normalized;
}

export function normalizeConfigurationAttributes(configurationAttributes) {
    let normalized = [];

    if (configurationAttributes) {
        for (let configurationAttribute of configurationAttributes) {
            if (configurationAttribute.key === undefined) throw "normalizeConfigurationAttributes: missing key";
            if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw "normalizeConfigurationAttributes: value and xmlfile can't both be set";

            normalized.push(Object.assign({}, defaultConfigurationAttributes, configurationAttribute, {
                groups: normalizeConfigurationAttributeGroups(configurationAttribute.groups),
            }));
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

function unshadow(userKey, usersMap) {      
    let user = usersMap.get(userKey);
    if (user != null && user.shadows != null) {
        let shadows = user.shadows;
        if (shadows.length > 0) {
            let additionalInfo = user.additional_info;
            if (!additionalInfo._unshadowed_groups) {
                additionalInfo._unshadowed_groups = user.groups;
                for (let shadowKey of [...shadows].reverse()) {
                    let shadow = usersMap.get(shadowKey);
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
                    let shadow = usersMap.get(shadowKey);
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