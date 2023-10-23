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
            for (let domain of domains) {
                let domainKey = domain.domainname;
                let additionalInfo = additionalInfosDomain[domainKey];
                if (additionalInfo) {
                    domain.additional_info = additionalInfo;
                    delete additionalInfosDomain[domainKey];       
                }
            }
        }     
        
        if (sortedAdditionalInfos.group && usergroups) {
            let additionalInfosGroup = sortedAdditionalInfos.group;
            for (let usergroup of usergroups) {
                let groupKey = usergroup.key;
                let additionalInfo = additionalInfosGroup[groupKey];
                if (additionalInfo) {
                    usergroup.additional_info = additionalInfo;
                    delete additionalInfosGroup[groupKey];    
                }
            }
        }        

        if (sortedAdditionalInfos.user && usermanagement) {
            let additionalInfosUser = sortedAdditionalInfos.user;    
            for (let user of usermanagement) {
                let userKey = user.login_name;        
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
    if (classes != null) {
        for (let clazz of classes) {    
            if (normalizeClass(clazz).attributesOrder == 'auto') {
                let attributes = clazz.attributes;
                if (attributes != null) {            
                    for (let attribute of clazz.attributes) {
                        if (attribute.writePerms) {
                            attribute.writePerms = reorganizePerms(attribute.writePerms);
                        }
                        if (attribute.readPerms) {
                            attribute.readPerms = reorganizePerms(attribute.readPerms);
                        }            
                    }
                    clazz.attributes = attributes.sort((a, b) => { 
                        return a.field.localeCompare(b.field);
                    });                
                }
            }
            if (clazz.writePerms) {
                clazz.writePerms = reorganizePerms(clazz.writePerms);
            }
            if (clazz.readPerms) {
                clazz.readPerms = reorganizePerms(clazz.readPerms);
            }
        }
        // TODO additionalattributes (which is a Map, not an array) ?

        classes = classes.sort((a, b) => {
            return a.table.localeCompare(b.table)
        });
    }
    
    return classes;
}

export function reorganizeDomains(domains) {
    if (domains != null) {
        for (let domain of domains) {
            if (domain.configurationAttributes) {
                domain.configurationAttributes = reorganizeConfigurationAttributes(domain.configurationAttributes);
            }
        }

        domains = domains.sort((a, b) => {
            let aDomainname = a.domainname.toUpperCase();
            let bDomainname = b.domainname.toUpperCase();        
            return aDomainname != 'LOCAL' || aDomainname.localeCompare(bDomainname);
        });
    }        
    return domains;
}

export function reorganizeDynchildhelpers(dynchildhelpers) {
    if (dynchildhelpers != null) {
        dynchildhelpers = dynchildhelpers.sort((a, b) => {
            let aName = a.name.toUpperCase();
            let bName = b.name.toUpperCase();        
            return aName.localeCompare(bName);
        });
    }           
    return dynchildhelpers;
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

export function reorganizeUsergroups(usergroups, additionalInfos = {}) {
    if (usergroups != null) {
        for (let usergroup of usergroups) {    
            if (usergroup.configurationAttributes) {
                usergroup.configurationAttributes = reorganizeConfigurationAttributes(usergroup.configurationAttributes);
            }
        }

        usergroups = usergroups.sort((a, b) => {
            let aGroupAndDomain = extractGroupAndDomain(extendLocalDomain(a.key));
            let bGroupAndDomain = extractGroupAndDomain(extendLocalDomain(b.key));
            let aDomain = aGroupAndDomain.domain != 'LOCAL' ? aGroupAndDomain.domain : ''
            let bDomain = bGroupAndDomain.domain != 'LOCAL' ? bGroupAndDomain.domain : ''
            return aDomain.localeCompare(bDomain) || aGroupAndDomain.group.localeCompare(bGroupAndDomain.group);
        });
    }
    return usergroups;
}

export function reorganizeUsermanagement(usermanagement) {
    if (usermanagement != null) {
        for (let user of usermanagement) {    
            if (user.configurationAttributes) {
                user.configurationAttributes = reorganizeConfigurationAttributes(user.configurationAttributes);
            }
            if (user.groups) {
                user.groups = user.groups.sort();
            }
        }

        usermanagement = usermanagement.sort((a, b) => {
            let aLoginName = a.login_name;
            let bLobinName = b.login_name;
            return aLoginName.localeCompare(bLobinName);
        });
    }    
    return usermanagement;
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

