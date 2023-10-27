import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain, extractGroupAndDomain } from "./tools/cids";

// ---

export default async function csReorganize(options) {
    let { targetDir } = options;
    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw Error("config not set");

    let reorganized = reorganizeConfigs(configs);

    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(reorganized, targetDir);
    }
    return reorganized;
}

// ---

export function reorganizeConfigs(configs) {
    return Object.assign({}, configs, {
        config: reorganizeConfig(configs.config), 
        additionalInfos: reorganizeAdditionalInfos(configs.additionalInfos, configs), 
        classes: reorganizeClasses(configs.classes), 
        domains: reorganizeDomains(configs.domains), 
        dynchildhelpers: reorganizeDynchildhelpers(configs.dynchildhelpers),
        policyRules: reorganizePolicyRules(configs.policyRules), 
        structure: reorganizeStructure(configs.structure), 
        usergroups: reorganizeUsergroups(configs.usergroups), 
        usermanagement: reorganizeUsermanagement(configs.usermanagement), 
    });
}

export function reorganizeConfig(config) {
    if (config != null) {
        let sync = config.sync;
        if (sync != null) {
            let noDropTables = sync.noDropTables;
            if (noDropTables != null) {
                sync.noDropTables = noDropTables.sort();
            }
            let noDropColumns = sync.noDropColumns;
            if (noDropColumns != null) {
                sync.noDropColumns = noDropColumns.sort();
            }
        }
    }
    return config;
}

export function reorganizeAdditionalInfos(additionalInfos, { domains, usergroups, usermanagement, classes }) {
    if (additionalInfos != null) {
        let sortedAdditionalInfos = {};    
        for (let type of Object.keys(additionalInfos).sort()) {
            let additionalInfo = additionalInfos[type];
            if (additionalInfo != null) {
                let sortedAdditionalInfo = {};
                for (let key of Object.keys(additionalInfo).sort()) {
                    sortedAdditionalInfo[key] = additionalInfo[key];
                }
                sortedAdditionalInfos[type] = sortedAdditionalInfo;                
            }
        }

        if (sortedAdditionalInfos.domain && domains) {
            let additionalInfosDomain = sortedAdditionalInfos.domain;
            for (let domainKey of Object.keys(domains)) {
                let domain = domains[domainKey];
                let additionalInfo = additionalInfosDomain[domainKey];
                if (additionalInfo) {
                    domain.additional_info = additionalInfo;
                    delete additionalInfosDomain[domainKey];       
                }
            }
        }     
        
        if (sortedAdditionalInfos.group && usergroups) {
            let additionalInfosGroup = sortedAdditionalInfos.group;
            for (let groupKey of Object.keys(usergroups)) {
                let usergroup = usergroups[groupKey];
                let additionalInfo = additionalInfosGroup[groupKey];
                if (additionalInfo) {
                    usergroup.additional_info = additionalInfo;
                    delete additionalInfosGroup[groupKey];    
                }
            }
        }        

        if (sortedAdditionalInfos.user && usermanagement) {
            let additionalInfosUser = sortedAdditionalInfos.user;    
            for (let userKey of Object.keys(usermanagement)) {
                let user = usermanagement[userKey]
                let additionalInfo = additionalInfosUser[userKey];
                if (additionalInfo) {
                    user.additional_info = additionalInfo;
                    delete additionalInfosUser[userKey];        
                }
            }
        }

        if (sortedAdditionalInfos.class && classes) {
            for (let classKey of Object.keys(classes)) {
                let clazz = classes[classKey];
                let attributes = clazz.attributes;
                if (sortedAdditionalInfos.attribute && attributes) {
                    let additionalInfosAttribute = sortedAdditionalInfos.attribute;    
                    for (let attributeKey of Object.keys(attributes)) {
                        let attribute = attributes[attributeKey];
                        let attrributeInfoKey = classKey + "." + attributeKey;
                        let additionalInfo = additionalInfosAttribute[attrributeInfoKey];
                        if (additionalInfo) {
                            attribute.additional_info = additionalInfo;
                            delete additionalInfosAttribute[attrributeInfoKey];        
                        }
                    }
                }

                let additionalInfosClass = sortedAdditionalInfos.class;    
                let additionalInfo = additionalInfosClass[classKey];
                if (additionalInfo) {
                    clazz.additional_info = additionalInfo;
                }
                delete additionalInfosClass[classKey];        
            }
        }
                
        return sortedAdditionalInfos;
    }        
    return additionalInfos;
}

export function reorganizeAttributes(attributes, order = 'auto') {
    if (attributes == null) return null;

    let reorganized = {};
    let sortedAttributeKeys = order == 'auto' ? Object.keys(attributes).sort((a, b) => { 
        return a.localeCompare(b);
    }) : Object.keys(attributes);

    for (let attributeKey of sortedAttributeKeys) {                    
        let attribute = attributes[attributeKey];
        reorganized[attributeKey] = Object.assign({
            readPerms: attribute.readPerms ? [...attribute.readPerms].sort() : attribute.readPerms, 
            writePerms: attribute.writePerms ? [...attribute.writePerms].sort() : attribute.writePerms,
        }, attribute)
    }
    return reorganized;         
}

export function reorganizeClasses(classes) {
    if (classes == null) return null;

    let sortedClassKeys = Object.keys(classes).sort((a, b) => {
        return a.localeCompare(b)
    })
    
    let reorganized = {};
    for (let classKey of sortedClassKeys) {
        let clazz = classes[classKey];
        reorganized[classKey] = Object.assign({
            readPerms: clazz.readPerms ? [...clazz.readPerms].sort() : clazz.readPerms,
            writePerms: clazz.writePerms ? [...clazz.writePerms].sort() : clazz.writePerms,
            attributes: reorganizeAttributes(clazz.attributes, clazz.attributesOrder),
        }, clazz);
    }
    
    return reorganized;
}

export function reorganizeDomains(domains) {
    if (domains == null) return null;

    let reorganized = {};
    reorganized['LOCAL'] = null;

    let sortedDomainKeys = Object.keys(domains).sort((a, b) => {
        let aDomainname = a.toUpperCase();
        let bDomainname = b.toUpperCase();        
        return aDomainname != 'LOCAL' || aDomainname.localeCompare(bDomainname);
    });

    for (let domainKey of sortedDomainKeys) {
        let domain = domains[domainKey];
        reorganized[domainKey] = reorganizeDomain(domain);
    }

    return reorganized;
}

export function reorganizeDomain(domain) {
    if (domain == null) return null;

    return Object.assign({}, domain, {
        configurationAttributes: domain.configurationAttributes ? reorganizeConfigurationAttributes(domain.configurationAttributes) : domain.configurationAttributes,
    });
}

export function reorganizeDynchildhelpers(dynchildhelpers) {
    let reorganized = {};
    if (dynchildhelpers != null) {
        for (let dynchildhelperKey of Object.keys(dynchildhelpers).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        }))
        reorganized[dynchildhelperKey] = dynchildhelpers[dynchildhelperKey];
    }           
    return reorganized;
}

export function reorganizePolicyRules(policyRules) {
    if (policyRules != null) {
        policyRules = policyRules.sort((a, b) => {
            let aPolicy = a.policy.toUpperCase();
            let bPolicy = b.policy.toUpperCase();        
            let aPermission = a.permission.toLowerCase();
            let bPermission = b.permission.toLowerCase();        
            return aPolicy.localeCompare(bPolicy) || aPermission.localeCompare(bPermission);
        });
    }
    return policyRules;
}

export function reorganizeStructure(structure) {
    return reorganizeNode(structure);
}

export function reorganizeUsergroups(usergroups) {
    let reorganized = {};
    if (usergroups != null) {
        let sortedGroupKeys = Object.keys(usergroups).sort((a, b) => {
            let aGroupAndDomain = extractGroupAndDomain(extendLocalDomain(a));
            let bGroupAndDomain = extractGroupAndDomain(extendLocalDomain(b));
            let aDomain = aGroupAndDomain.domain != 'LOCAL' ? aGroupAndDomain.domain : ''
            let bDomain = bGroupAndDomain.domain != 'LOCAL' ? bGroupAndDomain.domain : ''
            return aDomain.localeCompare(bDomain) || aGroupAndDomain.group.localeCompare(bGroupAndDomain.group);
        });
        for (let groupKey of sortedGroupKeys) {
            let usergroup = usergroups[groupKey];
            reorganized[groupKey] = reorganizeUsergroup(usergroup);
        }
    }
    return reorganized;
}

export function reorganizeUsergroup(usergroup) {
    let reorganized = {};
    if (usergroup) {
        Object.assign(reorganized, usergroup, {
            members: usergroup.members ? usergroup.members.sort() : usergroup.members,
            configurationAttributes: usergroup.configurationAttributes ? reorganizeConfigurationAttributes(usergroup.configurationAttributes) : usergroup.configurationAttributes,
        });
    }
    return reorganized;
}

export function reorganizeUsermanagement(usermanagement) {
    let reorganized = {};

    if (usermanagement != null) {
        let sortedUserKeys = Object.keys(usermanagement).sort();
        for (let userKey of sortedUserKeys) {    
            let user = usermanagement[userKey];
            reorganized[userKey] = reorganizeUser(user);
        }
    }    

    return reorganized;
}

export function reorganizeUser(user) {
    let reorganized = {};

    if (user) {
        Object.assign(reorganized, user, {
            configurationAttributes : user.configurationAttributes ? reorganizeConfigurationAttributes(user.configurationAttributes) : user.configurationAttributes,
            groups : user.groups ? [...user.groups.sort()] : user.groups,
            readPermClasses: user.readPermClasses ? [...user.readPermClasses].sort() : user.readPermClasses,
            writePermClasses: user.writePermClasses ? [...user.writePermClasses].sort() : user.writePermClasses,
            readPermAttributes: user.readPermAttributes ? [...user.readPermAttributes].sort() : user.readPermAttributes,
            writePermAttributes: user.writePermAttributes ? [...user.writePermAttributes].sort() : user.writePermAttributes,
        });
    }

    return reorganized;
}

// ---

/*
 * used by reorganizeStructure
 */
function reorganizeNode(node) {
    if (node != null) {
        for (let node of node) {
            if (node.readPerms != null) {
                node.readPerms = [...node.readPerms].sort();
            }
            if (node.writePerms != null) {
                node.writePerms = [...node.writePerms].sort();
            }
            if (node.children != null) {
                node.children = reorganizeNode(node.children);
            }
        }
    }
    return node;
}

/*
 * used by reorganizeDomains, reorganizeUsergroups, reorganizeUsermanagement
 */
function reorganizeConfigurationAttributes(configurationAttributes) {
    if (configurationAttributes == null) return null;
    
    let reorganized = {};
    let sortedConfigurationAttributeKeys = Object.keys(configurationAttributes).sort((a, b) => { 
        return a.localeCompare(b);
    })
    for (let configurationAttributeKey of sortedConfigurationAttributeKeys) {
        let configurationAttributeValue = configurationAttributes[configurationAttributeKey];
        if (Array.isArray(configurationAttributeValue)) {
            let configurationAttributeArray = Array.isArray(configurationAttributeValue) ? configurationAttributeValue : [ configurationAttributeValue ];
            let reorganizedArray = [];
            let sortedConfigurationAttributeArray = configurationAttributeArray.sort((a, b) => {
                if (!a.prio && !b.prio) return 0; // No change in order
                if (!a.prio) return 1;
                if (!b.prio) return -1;
                return a.prio - b.prio;
              })
            for (let configurationAttribute of sortedConfigurationAttributeArray) {
                reorganizedArray.push(Object.assign({}, configurationAttribute, {
                    groups: configurationAttribute.groups ? configurationAttribute.groups.sort() : configurationAttribute.groups,
                }));
            }    
            reorganized[configurationAttributeKey] = reorganizedArray;
        } else {
            let configurationAttribute = configurationAttributeValue;
            reorganized[configurationAttributeKey] = Object.assign({}, configurationAttribute, {
                groups: configurationAttribute.groups ? configurationAttribute.groups.sort() : configurationAttribute.groups,
            });
        }
    }
    return reorganized;
}

