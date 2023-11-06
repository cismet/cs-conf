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
        configurationAttributes: reorganizeConfigurationAttributes(configs.configurationAttributes),
        additionalInfos: reorganizeAdditionalInfos(configs.additionalInfos, configs), 
        classes: reorganizeClasses(configs.classes), 
        domains: reorganizeDomains(configs.domains), 
        dynchildhelpers: reorganizeDynchildhelpers(configs.dynchildhelpers),        
        structure: reorganizeStructure(configs.structure), 
        usergroups: reorganizeUsergroups(configs.usergroups), 
        usermanagement: reorganizeUsermanagement(configs.usermanagement), 
    });
}

export function reorganizeConfig(config) {
    if (!config) return config;

    let normalized = Object.assign({}, config, {
        policies: reorganizeConfigPolicies(config.policies),
        policyRules: reorganizeConfigPolicyRules(config.policyRules),
        sync: reorganizeConfigSync(config.sync),
    });
    return normalized;
}

export function reorganizeConfigSync(sync) {
    if (!sync) return sync;

    let normalized = {
        noDropTables: sync.noDropTables ? sync.noDropTables.sort((a, b) => { 
            return a.localeCompare(b);
        }) : sync.noDropTables,
        noDropColumns: sync.noDropColumns ? sync.noDropColumns.sort((a, b) => { 
            return a.localeCompare(b);
        }) : sync.noDropColumns,
    };
    return normalized;
}

export function reorganizeAdditionalInfos(additionalInfos, { domains, usergroups, usermanagement, classes, configurationAttributes }) {
    if (!additionalInfos) return additionalInfos;

    let sortedAdditionalInfos = {};    
    for (let type of Object.keys(additionalInfos).sort((a, b) => { 
        return a.localeCompare(b);
    })) {
        let additionalInfo = additionalInfos[type];
        if (additionalInfo != null) {
            let sortedAdditionalInfo = {};
            for (let key of Object.keys(additionalInfo).sort((a, b) => { 
                return a.localeCompare(b);
            })) {
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
            if (domain && additionalInfo) {
                domain.additional_info = additionalInfo;
                delete additionalInfosDomain[domainKey];       
            }
        }
    }     
    
    if (sortedAdditionalInfos.usergroup && usergroups) {
        let additionalInfosGroup = sortedAdditionalInfos.usergroup;
        for (let groupKey of Object.keys(usergroups)) {
            let usergroup = usergroups[groupKey];
            let additionalInfo = additionalInfosGroup[groupKey];
            if (usergroup && additionalInfo) {
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
            if (user && additionalInfo) {
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
                    if (attrributeInfoKey && additionalInfo) {
                        attribute.additional_info = additionalInfo;
                        delete additionalInfosAttribute[attrributeInfoKey];        
                    }
                }
            }

            let additionalInfosClass = sortedAdditionalInfos.class;    
            let additionalInfo = additionalInfosClass[classKey];
            if (additionalInfosClass && additionalInfo) {
                clazz.additional_info = additionalInfo;
            }
            delete additionalInfosClass[classKey];        
        }
    }
            
    if (sortedAdditionalInfos.configurationAttribute && configurationAttributes) {
        let additionalInfosConfAttr = sortedAdditionalInfos.configurationAttribute;    
        for (let configurationAttributeKey of Object.keys(additionalInfosConfAttr)) {
            let configurationAttribute = configurationAttributes[configurationAttributeKey]
            let additionalInfo = additionalInfosConfAttr[configurationAttributeKey];
            if (configurationAttribute && additionalInfo) {
                configurationAttribute.additional_info = additionalInfo;
                delete additionalInfosConfAttr[configurationAttributeKey];        
            }
        }
    }


        return sortedAdditionalInfos;
}

export function reorganizeAttributes(attributes, order = 'auto') {
    if (!attributes) return attributes;

    let reorganized = {};
    let sortedAttributeKeys = order == 'auto' ? Object.keys(attributes).sort((a, b) => { 
        return a.localeCompare(b);
    }) : Object.keys(attributes);

    for (let attributeKey of sortedAttributeKeys) {                    
        let attribute = attributes[attributeKey];
        reorganized[attributeKey] = Object.assign({
            readPerms: attribute.readPerms ? [...attribute.readPerms].sort((a, b) => { 
                return a.localeCompare(b);
            }) : attribute.readPerms, 
            writePerms: attribute.writePerms ? [...attribute.writePerms].sort((a, b) => { 
                return a.localeCompare(b);
            }) : attribute.writePerms,
        }, attribute)
    }
    return reorganized;         
}

export function reorganizeClasses(classes) {
    if (!classes) return classes;

    let sortedClassKeys = Object.keys(classes).sort((a, b) => {
        return a.localeCompare(b)
    })
    
    let reorganized = {};
    for (let classKey of sortedClassKeys) {
        let clazz = classes[classKey];
        reorganized[classKey] = Object.assign({
            readPerms: clazz.readPerms ? [...clazz.readPerms].sort((a, b) => { 
                return a.localeCompare(b);
            }) : clazz.readPerms,
            writePerms: clazz.writePerms ? [...clazz.writePerms].sort((a, b) => { 
                return a.localeCompare(b);
            }) : clazz.writePerms,
            attributes: reorganizeAttributes(clazz.attributes, clazz.attributesOrder),
        }, clazz);
    }
    
    return reorganized;
}

export function reorganizeDomains(domains) {
    if (!domains) return domains;

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
    if (!domain) return domain;

    let reorganized = {};
    if (domain) {
        Object.assign(reorganized, domain, {
            configurationAttributes: domain.configurationAttributes ? reorganizeConfigurationAttributeValues(domain.configurationAttributes) : domain.configurationAttributes,
            inspected: domain.inspected ? reorganizeDomainInspected(domain.inspected) : domain.inspected 
        });
    }
    return reorganized;
}

export function reorganizeDomainInspected(domainInspected) {
    if (!domainInspected) return domainInspected;

    let reorganized = {};
    if (domainInspected) {
        Object.assign(reorganized, domainInspected, {
            groups: domainInspected.groups ? domainInspected.groups.sort((a, b) => { 
                return a.localeCompare(b);
            }) : domainInspected.groups,
        });
    }
    return reorganized;
}

export function reorganizeDynchildhelpers(dynchildhelpers) {
    if (!dynchildhelpers) return dynchildhelpers;

    let reorganized = {};
    if (dynchildhelpers != null) {
        for (let dynchildhelperKey of Object.keys(dynchildhelpers).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        }))
        reorganized[dynchildhelperKey] = dynchildhelpers[dynchildhelperKey];
    }           
    return reorganized;
}

export function reorganizeConfigurationAttributes(configurationAttributes) {
    if (!configurationAttributes) return configurationAttributes;

    let reorganized = {};
    for (let configurationAttribute of Object.keys(configurationAttributes).sort((a, b) => {
        return a.localeCompare(b);
    })) {
        reorganized[configurationAttribute] = configurationAttributes[configurationAttribute];
    }
    return reorganized;
}

export function reorganizeConfigurationAttribute(configurationAttribute) {
    if (!configurationAttribute) return configurationAttribute;

    let reorganized = {};
    Object.assign(reorganized, configurationAttribute, {
        inspected: reorganizeConfigurationAttributeInspected(configurationAttribute.inspected),
    });
    return reorganized;
}

export function reorganizeConfigurationAttributeInspected(configurationAttributeInspected) {
    if (!configurationAttributeInspected) return configurationAttributeInspected;

    let reorganized = {};
    if (configurationAttributeInspected) {
        Object.assign(reorganized, configurationAttributeInspected, {
            domainValues: reorganizeConfigurationAttributeValues(configurationAttributeInspected.domainValues),
            groupValues: reorganizeConfigurationAttributeValues(configurationAttributeInspected.groupValues),
            userValues: reorganizeConfigurationAttributeValues(configurationAttributeInspected.userValues),
        });
    }
    return reorganized;
}

export function reorganizeConfigPolicies(policies) {
    if (!policies) return policies;

    let reorganized = Object.assign({}, policies);
    return reorganized;
}

export function reorganizeConfigPolicyRules(policyRules) {
    if (!policyRules) return policyRules;

    let reorganized = Object.assign({}, policyRules);
    return reorganized;
}

export function reorganizeStructure(structure) {
    return reorganizeNode(structure);
}

export function reorganizeUsergroups(usergroups) {
    if (!usergroups) return usergroups;

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
    if (!usergroup) return usergroup;

    let reorganized = {};
    if (usergroup) {
        Object.assign(reorganized, usergroup, {
            configurationAttributes: usergroup.configurationAttributes ? reorganizeConfigurationAttributeValues(usergroup.configurationAttributes) : usergroup.configurationAttributes,
            inspected: usergroup.inspected ? reorganizeUsergroupInspected(usergroup.inspected) : usergroup.inspected 
        });
    }
    return reorganized;
}

export function reorganizeUsergroupInspected(usergroupInspected) {
    if (!usergroupInspected) return usergroupInspected;

    let reorganized = {};
    if (usergroupInspected) {
        Object.assign(reorganized, usergroupInspected, {
            members: usergroupInspected.members ? usergroupInspected.members.sort((a, b) => { 
                return a.localeCompare(b);
            }) : usergroupInspected.members,
            allConfigurationAttributes: usergroupInspected.allConfigurationAttributes ? reorganizeConfigurationAttributeValues(usergroupInspected.allConfigurationAttributes) : usergroupInspected.configurationAttributes,
            permissions: usergroupInspected.permissions ? reorganizeUsergroupInspectedPermissions(usergroupInspected.permissions) : usergroupInspected.permissions,
        });
    }
    return reorganized;
}

export function reorganizeUsergroupInspectedPermissions(usergroupInspectedPermissions) {
    if (!usergroupInspectedPermissions) return usergroupInspectedPermissions;

    let reorganized = {};
    if (usergroupInspectedPermissions) {
        Object.assign(reorganized, usergroupInspectedPermissions, {
            canReadClasses: usergroupInspectedPermissions.canReadClasses ? usergroupInspectedPermissions.canReadClasses.sort((a, b) => { 
                return a.localeCompare(b);
            }) : usergroupInspectedPermissions.canReadClasses,
            canWriteClasses: usergroupInspectedPermissions.canWriteClasses ? usergroupInspectedPermissions.canWriteClasses.sort((a, b) => { 
                return a.localeCompare(b);
            }) : usergroupInspectedPermissions.canWriteClasses,
            canReadAttributes: usergroupInspectedPermissions.canReadAttributes ? usergroupInspectedPermissions.canReadAttributes.sort((a, b) => { 
                return a.localeCompare(b);
            }) : usergroupInspectedPermissions.canReadAttributes,
            canWriteAttributes: usergroupInspectedPermissions.canWriteAttributes ? usergroupInspectedPermissions.canWriteAttributes.sort((a, b) => { 
                return a.localeCompare(b);
            }) : usergroupInspectedPermissions.canWriteAttributes,
        });
    }
    return reorganized;
}

export function reorganizeUsermanagement(usermanagement) {
    if (!usermanagement) return usermanagement;

    let reorganized = {};
    if (usermanagement != null) {
        let sortedUserKeys = Object.keys(usermanagement).sort((a, b) => { 
            return a.localeCompare(b);
        });
        for (let userKey of sortedUserKeys) {    
            let user = usermanagement[userKey];
            reorganized[userKey] = reorganizeUser(user);
        }
    }    
    return reorganized;
}

export function reorganizeUser(user) {
    if (!user) return user;

    let reorganized = {};
    if (user) {
        Object.assign(reorganized, user, {
            groups : user.groups ? [...user.groups.sort((a, b) => { 
                return a.localeCompare(b);
            })] : user.groups,
            configurationAttributes : user.configurationAttributes ? reorganizeConfigurationAttributeValues(user.configurationAttributes) : user.configurationAttributes,
            inspected: user.inspected ? reorganizeUserInspected(user.inspected) : user.inspected 
        });
    }

    return reorganized;
}

export function reorganizeUserInspected(userInspected) {
    if (!userInspected) return userInspected;

    let reorganized = {};
    if (userInspected) {
        let memberOf = userInspected.memberOf ? userInspected.memberOf.sort((a, b) => { 
            return a.localeCompare(b);
        }) : userInspected.memberOf;
        let shadowMemberOf = {};
        if (userInspected.shadowMemberOf) {
            for (let shadowKey of Object.keys(userInspected.shadowMemberOf).sort((a, b) => { 
                return a.localeCompare(b);
            })) {
                shadowMemberOf[shadowKey] = userInspected.shadowMemberOf[shadowKey] ? userInspected.shadowMemberOf[shadowKey].sort((a, b) => { 
                    return a.localeCompare(b);
                }) : userInspected.shadowMemberOf[shadowKey];
            }
        } 
        let allConfigurationAttributes = userInspected.allConfigurationAttributes ? reorganizeConfigurationAttributeValues(userInspected.allConfigurationAttributes) : userInspected.configurationAttributes;
        let permissions = userInspected.permissions ? reorganizeUserInspectedPermissions(userInspected.permissions) : userInspected.permissions;

        Object.assign(reorganized, userInspected, {
            memberOf,
            shadowMemberOf,
            allConfigurationAttributes,
            permissions,
        });
    }
    return reorganized;
}

export function reorganizeUserInspectedPermissions(userInspectedPermissions) {
    if (!userInspectedPermissions) return userInspectedPermissions;

    let reorganized = {};
    if (userInspectedPermissions) {
        let canReadClasses = userInspectedPermissions.canReadClasses ? userInspectedPermissions.canReadClasses.sort((a, b) => { 
            return a.localeCompare(b);
        }) : userInspectedPermissions.canReadClasses;
        let canWriteClasses = userInspectedPermissions.canWriteClasses ? userInspectedPermissions.canWriteClasses.sort((a, b) => { 
            return a.localeCompare(b);
        }) : userInspectedPermissions.canWriteClasses;
        let canReadAttributes = userInspectedPermissions.canReadAttributes ? userInspectedPermissions.canReadAttributes.sort((a, b) => { 
            return a.localeCompare(b);
        }) : userInspectedPermissions.canReadAttributes;
        let canWriteAttributes = userInspectedPermissions.canWriteAttributes ? userInspectedPermissions.canWriteAttributes.sort((a, b) => { 
            return a.localeCompare(b);
        }) : userInspectedPermissions.canWriteAttributes;

        Object.assign(reorganized, userInspectedPermissions, {
            canReadClasses,
            canWriteClasses,
            canReadAttributes,
            canWriteAttributes,
        });
    }
    return reorganized;
}

// ---

/*
 * used by reorganizeStructure
 */
function reorganizeNode(node) {
    if (!node) return node;

    for (let node of node) {
        if (node.readPerms != null) {
            node.readPerms = [...node.readPerms].sort((a, b) => { 
                return a.localeCompare(b);
            });
        }
        if (node.writePerms != null) {
            node.writePerms = [...node.writePerms].sort((a, b) => { 
                return a.localeCompare(b);
            });
        }
        if (node.children != null) {
            node.children = reorganizeNode(node.children);
        }
    }
    return node;
}

/*
 * used by reorganizeDomains, reorganizeUsergroups, reorganizeUsermanagement
 */
function reorganizeConfigurationAttributeValues(configurationAttributeValues) {
    if (!configurationAttributeValues) return configurationAttributeValues;
    
    let reorganized = {};
    let sortedConfigurationAttributeKeys = Object.keys(configurationAttributeValues).sort((a, b) => { 
        return a.localeCompare(b);
    })
    for (let configurationAttributeKey of sortedConfigurationAttributeKeys) {
        let configurationAttributeValue = configurationAttributeValues[configurationAttributeKey];
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
                    groups: configurationAttribute.groups ? configurationAttribute.groups.sort((a, b) => { 
                        return a.localeCompare(b);
                    }) : configurationAttribute.groups,
                }));
            }    
            reorganized[configurationAttributeKey] = reorganizedArray;
        } else {
            let configurationAttribute = configurationAttributeValue;
            reorganized[configurationAttributeKey] = Object.assign({}, configurationAttribute, {
                groups: configurationAttribute.groups ? configurationAttribute.groups.sort((a, b) => { 
                    return a.localeCompare(b);
                }) : configurationAttribute.groups,
            });
        }
    }
    return reorganized;
}

