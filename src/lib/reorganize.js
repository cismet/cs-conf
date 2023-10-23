import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import { extendLocalDomain, extractGroupAndDomain } from "./tools/cids";
import { normalizeClass } from "./normalize";

// ---

export default async function csReorganize(options) {
    let { targetDir } = options;
    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";

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
            for (let clazz of classes) {
                let classKey = clazz.table;
                let attributes = clazz.attributes;
                if (sortedAdditionalInfos.attribute && attributes) {
                    let additionalInfosAttribute = sortedAdditionalInfos.attribute;    
                    for (let attribute of attributes) {
                        let attrributeKey = classKey + "." + attribute.field;
                        let additionalInfo = additionalInfosAttribute[attrributeKey];
                        if (additionalInfo) {
                            attribute.additional_info = additionalInfo;
                            delete additionalInfosAttribute[attrributeKey];        
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

export function reorganizeClasses(classes) {
    let reorganizedClasses = undefined;

    if (classes != null) {
        reorganizedClasses = [];
        for (let clazz of classes) {    
            let reorganizedAttributes = undefined;
            
            let attributes = clazz.attributes;                
            if (attributes != null) {      
                let reorganizedAttributes = {};
                let sortedAttributeKeys = normalizeClass(clazz).attributesOrder == 'auto' ? Object.keys(attributes).sort((a, b) => { 
                    return a.localeCompare(b);
                }) : Object.keys(attributes);

                for (let attributeKey of sortedAttributeKeys) {                    
                    let attribute = attributes[attributeKey];
                    reorganizedAttributes[attributeKey] = Object.assign({
                        readPerms: (attribute.readPerms) ? reorganizePerms(attribute.readPerms) : undefined, 
                        writePerms: (attribute.writePerms) ? reorganizePerms(attribute.writePerms) : undefined,
                    }, attribute)
                }
                clazz.attributes = attributes;         
            }

            reorganizedClasses.push(Object.assign({
                readPerms: clazz.readPerms ? reorganizePerms(clazz.readPerms) : undefined,
                writePerms: clazz.writePerms ? reorganizePerms(clazz.writePerms) : undefined,
                attributes: reorganizedAttributes,
            }, clazz));
        }

        reorganizedClasses = classes.sort((a, b) => {
            return a.table.localeCompare(b.table)
        });
    }
    
    return reorganizedClasses;
}

export function reorganizeDomains(domains) {
    if (domains == null) {
        return null;
    }

    let reorganized = {};
    reorganized['LOCAL'] = null;

    let sortedDomainKeys = Object.keys(domains).sort((a, b) => {
        let aDomainname = a.toUpperCase();
        let bDomainname = b.toUpperCase();        
        return aDomainname != 'LOCAL' || aDomainname.localeCompare(bDomainname);
    });

    for (let domainKey of sortedDomainKeys) {
        let domain = domains[domainKey];
        reorganized[domainKey] = Object.assign({}, domain, {
            configurationAttributes: domain.configurationAttributes ? reorganizeConfigurationAttributes(domain.configurationAttributes) : undefined,
        });
    }

    return reorganized;
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
            reorganized[groupKey] = Object.assign({}, usergroup, {
                configurationAttributes: usergroup.configurationAttributes ? reorganizeConfigurationAttributes(usergroup.configurationAttributes) : undefined,
            });
        }
    }
    return reorganized;
}

export function reorganizeUsermanagement(usermanagement) {
    let reorganized = {};

    if (usermanagement != null) {
        let sortedUserKeys = Object.keys(usermanagement).sort();
        for (let userKey of sortedUserKeys) {    
            let user = usermanagement[userKey];
            reorganized[userKey] = Object.assign({}, user, {
                configurationAttributes : user.configurationAttributes ? reorganizeConfigurationAttributes(user.configurationAttributes) : undefined,
                groups : user.groups ? user.groups.sort() : undefined,
            });
        }
    }    

    return reorganized;
}

// ---

/*
 * used by reorganizeClasses, reorganizeStructure
 */
function reorganizePerms(perms) {
    if (perms == null) return null;

    return perms.sort();
}

/*
 * used by reorganizeStructure
 */
function reorganizeNode(node) {
    if (node != null) {
        for (let node of node) {
            if (node.readPerms != null) {
                node.readPerms = reorganizePerms(node.readPerms);
            }
            if (node.writePerms != null) {
                node.writePerms = reorganizePerms(node.writePerms);
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
    
    if (configurationAttributes.groups) {
        configurationAttributes.groups = configurationAttributes.groups.sort();
    }

    return configurationAttributes.sort((a, b) => { 
        let aKey = a.key;
        let bKey = b.key;
        return aKey.localeCompare(bKey);
    });
}

