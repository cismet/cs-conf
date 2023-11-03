import util from 'util';
import zeroFill from 'zero-fill';
import xmlFormatter from 'xml-formatter';
import slug from 'slug';
import striptags from 'striptags';

import { writeConfigFiles } from './tools/configFiles';
import { clean, logOut, logWarn, logVerbose } from './tools/tools';
import { getClientInfo, initClient } from './tools/db';

import { simplifyConfigs } from './simplify';
import { reorganizeConfigs } from './reorganize';
import { normalizeConfig } from './normalize';
import { defaultConfigPolicyRules } from './tools/defaultObjects';

export default async function csExport(options) {
    let  { targetDir, normalized = false } = options;

    let fetchedData = await fetch();
    let configs = exportConfigs(fetchedData, global.config);

    configs = reorganizeConfigs(configs);

    if (!normalized) {
        configs = simplifyConfigs(configs);
    }

    let configsDir = targetDir ?? normalizeConfig(configs.config).configsDir;
    writeConfigFiles(configs, configsDir);
}

async function fetch() {
    let client = await initClient(global.config.connection);

    logOut(util.format("Fetching cs Data from '%s' ...", getClientInfo()));
    return {
        csAdditionalInfos: await fetchStatement(client, 'cs_info', additionalInfosExportStatement),
        csPolicyRules: await fetchStatement(client, 'cs_policy_rules', policyRulesExportStatement),
        csConfigAttrValues: await fetchStatement(client, 'cs_config_attr_values', configAttrValuesExportStatement),
        csConfigAttrKeys: await fetchStatement(client, 'cs_config_attr_keys', configAttrKeysExportStatement),
        csDomains: await fetchStatement(client, 'cs_domains', domainsExportStatement),
        csUgs: await fetchStatement(client, 'cs_ug', usergroupsExportStatement),
        csUsrs: await fetchStatement(client, 'cs_usr', usersExportStatement),
        csUgMemberships: await fetchStatement(client, 'cs_ug_membership', usergroupmembershipExportStatement),
        csClasses: await fetchStatement(client, 'cs_classes', classesExportStatement),
        csClassAttrs: await fetchStatement(client, 'cs_class_attr', classAttributesExportStatement),
        csUgClassPerms: await fetchStatement(client, 'cs_ug_class_perm', classPermissionsExportStatement),
        csAttrs: await fetchStatement(client, 'cs_attr', attributesExportStatement),
        csUgAttrPerms: await fetchStatement(client, 'cs_ug_attr_perm', attributePermissionsExportStatement),
        csCatNodes: await fetchStatement(client, 'cs_cat_node', nodesExportStatement),
        csCatLinks: await fetchStatement(client, 'cs_cat_link', linksExportStatement),
        csUgCatNodePerms: await fetchStatement(client, 'cs_ug_cat_node_perm', nodePermissionsExportStatement),
        csDynamicChildreHelpers: await fetchStatement(client, 'cs_dynamic_children_helper', dynchildhelpersExportStatement),
    };
}

async function fetchStatement(client, topic, statement) {
    logVerbose(util.format(" ↳ fetching %s", topic));
    return (await client.query(statement)).rows;
}

function exportConfigs(fetchedData, config) {
    logOut(util.format("Exporting configuration from '%s' ...", getClientInfo()));
    let configs = { config };

    logVerbose(" ↳ exporting policyRules into config.json");
    Object.assign(configs, exportPolicyRules(fetchedData, configs));

    logVerbose(" ↳ creating additionalInfos.json");
    Object.assign(configs, exportAdditionalInfos(fetchedData, configs));

    logVerbose(" ↳ creating configurationAttributes.json and xml-config-attrs files");
    Object.assign(configs, exportConfigAttributes(fetchedData, configs));

    logVerbose(" ↳ creating domains.json");
    Object.assign(configs, exportDomains(fetchedData, configs));

    logVerbose(" ↳ creating usergroups.json");
    Object.assign(configs, exportUsergroups(fetchedData, configs));

    logVerbose(" ↳ creating usermanagement.json");
    Object.assign(configs, exportUserManagement(fetchedData, configs));

    logVerbose(" ↳ creating policyRules.json");
    Object.assign(configs, exportPolicyRules(fetchedData, configs));

    logVerbose(" ↳ creating classes.json");
    Object.assign(configs, exportClasses(fetchedData, configs));

    logVerbose(" ↳ creating dynchildhelpers.json and structure-helper-stmnts files");
    Object.assign(configs, exportDynchildhelpers(fetchedData, configs));

    logVerbose(" ↳ creating structure.json and structure-dyn-children-stmnts files");
    Object.assign(configs, exportStructure(fetchedData, configs));


    let {usermanagement, additionalInfos} = configs;
    for (let userKey of Object.keys(usermanagement)) {
        let user = usermanagement[userKey];
        let additionalInfo = additionalInfos && additionalInfos.user ? additionalInfos.user[userKey] : {};
        usermanagement[userKey] = shadowing(user, additionalInfo);
    }
    return configs;
}

export function shadowing(user, additionalInfo = user.additional_info) {
    if (!user) return user;

    let shadowed = Object.assign({}, user);
    if (additionalInfo && additionalInfo._shadow) {
        let _shadow = additionalInfo._shadow;

        Object.assign(shadowed, {
            groups: _shadow.ownGroups ? [... _shadow.ownGroups] : [],
            configurationAttributes: _shadow.ownConfigurationAttributes ? Object.assign({}, _shadow.ownConfigurationAttributes) : {},
        });
    }
    return shadowed;
}

// ---

function exportAdditionalInfos({ csAdditionalInfos }) {
    let additionalInfos = {};

    for (let csAdditionalInfo of csAdditionalInfos) {
        let additionalInfo = Object.assign({}, csAdditionalInfo);
        let type = additionalInfo.type;
        let key = additionalInfo.key;
        delete additionalInfo.type;
        delete additionalInfo.key;
        
        let additionalInfosOfType = additionalInfos[type] ?? {};
        additionalInfos[type] = additionalInfosOfType;
        additionalInfosOfType[key] = additionalInfo.json;
    }
    return { additionalInfos };
}

function exportClasses({ csClasses, csAttrs, csClassAttrs, csUgClassPerms, csUgAttrPerms }, {}) {
    let classAttrsPerTable = new Map(); 
    
    for (let csClassAttr of csClassAttrs) {
        let classAttribute = classAttrsPerTable.get(csClassAttr.table);
        if (!classAttribute) {
            classAttribute = {};
            classAttrsPerTable.set(csClassAttr.table, classAttribute);
        }
        classAttribute[csClassAttr.key] = csClassAttr.value;
    }

    let attrReadPerms = new Map();
    let attrWritePerms = new Map();

    for (let csUgAttrPerm of csUgAttrPerms) {
        let ug = util.format("%s@%s", csUgAttrPerm.group, csUgAttrPerm.domain);
        let key = util.format("%s.%s", csUgAttrPerm.table, csUgAttrPerm.field);
        let attrReadPermissions = attrReadPerms.get(key);
        if (csUgAttrPerm.permission === "read") {
            if (!attrReadPermissions) {
                attrReadPermissions = [];
                attrReadPerms.set(key, attrReadPermissions);
            }
            attrReadPermissions.push(ug);
        } else if (csUgAttrPerm.permission === "write") {
            let attrWritePermissions = attrWritePerms.get(key);
            if (!attrWritePermissions) {
                attrWritePermissions = [];
                attrWritePerms.set(key, attrWritePermissions);
            }
            attrWritePermissions.push(ug);
        }
    }
    
    let attrsPerTable = new Map();
    let attributes = {};
    for (let csAttr of csAttrs) {
        let attribute = Object.assign({}, csAttr);
        let attributes = attrsPerTable.get(attribute.table);
        if (!attributes) {
            attributes = {};
            attrsPerTable.set(attribute.table, attributes);
        }

        // clean up

        delete attribute.table;
        if (attribute.field === attribute.name) {
            delete attribute.name;
        }
        
        if (attribute.cidsType !== null) {
            delete attribute.dbType;
            delete attribute.precision;
            delete attribute.scale;
            if (attribute.foreignKeyTableId < 0) {
                delete attribute.cidsType;
                delete attribute.optional;
                delete attribute.manyToMany;
            } else if (attribute.isArrray === true) {
                delete attribute.cidsType;
                delete attribute.optional;
                delete attribute.oneToMany;
            } else {
                delete attribute.oneToMany;
                delete attribute.manyToMany
            }
        } else {
            delete attribute.cidsType;
            delete attribute.oneToMany;
            delete attribute.manyToMany
        }

        if (attribute.mandatory === false) {
            delete attribute.mandatory;
        }

        if (attribute.hidden === false) {
            delete attribute.hidden;
        }
        if (attribute.indexed === false) {
            delete attribute.indexed;
        }
        if (attribute.substitute === false) {
            delete attribute.substitute;
        }
        if (attribute.extension_attr === false) {
            delete attribute.extension_attr;
        }

        //remove all fields that are not needed anymore
        delete attribute.foreign_key;
        delete attribute.foreignKeyTableId;
        delete attribute.foreignkeytable; // check whether this should better be used instead of tc.table_name
        delete attribute.isArrray;

        let permKey = util.format("%s.%s", attribute.table, attribute.field);
        attribute.readPerms = attrReadPerms.get(permKey);
        attribute.writePerms = attrWritePerms.get(permKey);
    
        let attributeKey = attribute.field;
        delete attribute.field;

        //finally remove all field that are null
        clean(attribute);

        attributes[attributeKey] = attribute;
    }

    let classReadPerms = new Map();
    let classWritePerms = new Map();
    for (let csUgClassPerm of csUgClassPerms) {
        let ug = util.format("%s@%s", csUgClassPerm.group, csUgClassPerm.domain);
        let tableReadPermissions = classReadPerms.get(csUgClassPerm.table);
        if (csUgClassPerm.permission === "read") {
            if (!tableReadPermissions) {
                tableReadPermissions = [];
                classReadPerms.set(csUgClassPerm.table, tableReadPermissions);
            }
            tableReadPermissions.push(ug);
        } else if (csUgClassPerm.permission === "write") {
            let tableWritePermissions = classWritePerms.get(csUgClassPerm.table);
            if (!tableWritePermissions) {
                tableWritePermissions = [];
                classWritePerms.set(csUgClassPerm.table, tableWritePermissions);
            }
            tableWritePermissions.push(ug);
        }
    }

    let classes = {};
    for (let csClass of csClasses) {        
        let clazz = Object.assign({}, csClass);
        let classKey = clazz.table;

        //clean up
        if (classKey === clazz.name) {
            delete clazz.name;
        }
        if (clazz.descr === null) {
            delete clazz.descr;
        }
        if (clazz.indexed === false) {
            delete clazz.indexed;
        }

        if (clazz.classIcon === clazz.objectIcon) {
            clazz.icon = clazz.classIcon;
            delete clazz.classIcon;
            delete clazz.objectIcon;
        } else {
            delete clazz.icon;
        }
        if (clazz.array_link === false) {
            delete clazz.array_link;
        }
        if (clazz.policy === null) {
            delete clazz.policy;
        }
        if (clazz.attribute_policy === null) {
            delete clazz.attribute_policy;
        }

        //toString
        if (clazz.toStringType !== null && clazz.toStringClass != null) {
            clazz.toString = {
                type: clazz.toStringType,
                class: clazz.toStringClass
            };
        }
        delete clazz.toStringType;
        delete clazz.toStringClass;
        //editor
        if (clazz.editorType !== null && clazz.editorClass != null) {
            clazz.editor = {
                type: clazz.editorType,
                class: clazz.editorClass
            };
        }
        delete clazz.editorType;
        delete clazz.editorClass;
        //renderer
        if (clazz.rendererType !== null && clazz.rendererClass != null) {
            clazz.renderer = {
                type: clazz.rendererType,
                class: clazz.rendererClass
            };
        }
        delete clazz.rendererType;
        delete clazz.rendererClass;

        //add attributes
        let attrs = attrsPerTable.get(classKey);
        if (attrs) {
            clazz.attributes = attrs;
        }

        //add class attributes
        let cattrs = classAttrsPerTable.get(classKey);
        if (cattrs) {
            clazz.additionalAttributes = cattrs;
        }

        clazz.readPerms = classReadPerms.get(classKey);
        clazz.writePerms = classWritePerms.get(classKey);

        classes[classKey] = clazz;
    }

    return { classes, attributes };
}


function exportConfigAttributes({ csConfigAttrKeys, csConfigAttrValues }, {}) {

    let configurationAttributes = {};
    for (let csConfigAttrKey of csConfigAttrKeys) {
        let configurationAttributeKey = csConfigAttrKey.key;
        let configurationAttribute = {};
        switch (csConfigAttrKey.type) {
            case 'C': {
                Object.assign(configurationAttribute, {type: "value"});
            } break;
            case 'X': {
                Object.assign(configurationAttribute, {type: "xml"});
            } break;
            default: {
                Object.assign(configurationAttribute, {type: "action"});
            }
        }
        configurationAttributes[configurationAttributeKey] = configurationAttribute;
    }

    let configurationAttributeValues = {
        domain: {},
        group: {},
        user: {},
    }

    let xmlFiles = new Map();

    let valuesToFilename = new Map();
    let xmlDocCounter = new Map();
    for (let csConfigAttrValue of csConfigAttrValues) {
        let configurationAttributeKey = csConfigAttrValue.key;
        let configurationAttributeValue = {};
        switch (configurationAttributes[configurationAttributeKey].type) {
            case 'value': {
                configurationAttributeValue.value = csConfigAttrValue.value                
            } break;
            case 'xml': {
                let xmlToSave;
                try {
                    xmlToSave = xmlFormatter(csConfigAttrValue.value, { collapseContent: true, lineSeparator: '\n', stripComments: false });
                } catch (formatterProblem) {
                    xmlToSave = csConfigAttrValue.value;
                }                    

                let fileName;
                if (csConfigAttrValue.filename != null) {
                    fileName = csConfigAttrValue.filename;
                } else if (valuesToFilename.has(csConfigAttrValue.value)) {
                    fileName = valuesToFilename.get(csConfigAttrValue.value);
                } else {
                    let counter = xmlDocCounter.has(csConfigAttrValue.key) ? xmlDocCounter.get(csConfigAttrValue.key) + 1 : 1;
                    xmlDocCounter.set(csConfigAttrValue.key, counter);
                    fileName = util.format("%s.%s.xml", csConfigAttrValue.key, zeroFill(4, counter));
                }
                valuesToFilename.set(csConfigAttrValue.value, fileName);
                xmlFiles.set(fileName, xmlToSave);
                configurationAttributeValue.xmlfile = fileName;
            } break;
        }
        if (csConfigAttrValue.login_name) {
            configurationAttributeValue = Object.assign(configurationAttributeValue, { groups: [ csConfigAttrValue.groupkey ] });
            let configurationAttributeValuesUser = configurationAttributeValues.user[csConfigAttrValue.login_name];
            if (configurationAttributeValuesUser) {
                let configurationAttributeArray = configurationAttributeValuesUser[configurationAttributeKey];
                if (configurationAttributeArray) {
                    let found = false;
                    for (let configurationAttribute of configurationAttributeArray) {
                        if (configurationAttribute != null) {
                            found = true;
                            if (csConfigAttrValue.groupkey != null && configurationAttribute.groups != null && !configurationAttribute.groups.contains(csConfigAttrValue.groupkey)) {
                                configurationAttribute.groups.push(csConfigAttrValue.groupkey);
                            }
                            break;
                        }
                    }
                    if (!found) {
                        configurationAttributeArray.push(configurationAttributeValue);
                    }
                } else {
                    configurationAttributeValuesUser[configurationAttributeKey] = [configurationAttributeValue];
                }
            } else {
                configurationAttributeValues.user[csConfigAttrValue.login_name] = { [configurationAttributeKey]: [configurationAttributeValue] };
            }
        } else if (csConfigAttrValue.groupkey) {
            let configurationAttributeValuesGroup = configurationAttributeValues.group[csConfigAttrValue.groupkey];
            if (configurationAttributeValuesGroup) {
                let configurationAttributeArray = configurationAttributeValuesGroup[configurationAttributeKey];
                if (configurationAttributeArray) {
                    configurationAttributeArray.push(configurationAttributeValue);
                } else {
                    configurationAttributeValuesGroup[configurationAttributeKey] = [configurationAttributeValue];
                }
            } else {
                configurationAttributeValues.group[csConfigAttrValue.groupkey] = { [configurationAttributeKey]: [configurationAttributeValue] };
            }
        } else if (csConfigAttrValue.domainname) {
            let configurationAttributeValuesDomain = configurationAttributeValues.domain[csConfigAttrValue.domainname];
            if (configurationAttributeValuesDomain) {
                let configurationAttributeArray = configurationAttributeValuesDomain[configurationAttributeKey];
                if (configurationAttributeArray) {
                    configurationAttributeArray.push(configurationAttributeValue);
                } else {
                    configurationAttributeValuesDomain[configurationAttributeKey] = [configurationAttributeValue];
                }                
            } else {
                configurationAttributeValues.domain[csConfigAttrValue.domainname] = { [configurationAttributeKey]: [configurationAttributeValue] };
            }
        }
    }
    return {
        configurationAttributes,
        configurationAttributeValues,
        xmlFiles
    }
}

function exportDomains({ csDomains }, { configurationAttributeValues }) {
    let domains = {};
    for (let csDomain of csDomains) {
        let domain = Object.assign({}, csDomain);

        let domainKey = domain.domainname;
        delete domain.domainname;
        
        //add the configuration attributes
        let configurationAttributeValuesDomain = configurationAttributeValues.domain[domainKey];
        if (configurationAttributeValuesDomain) {
            domain.configurationAttributes = configurationAttributeValuesDomain;        
        }
        domains[domainKey] = domain;
    }
    return { domains };
}

function exportDynchildhelpers({ csDynamicChildreHelpers }, {}) {
    let dynchildhelpers = {};
    let helperSqlFiles = new Map();

    for (let csDynamicChildreHelper of csDynamicChildreHelpers) {
        let dynchildhelper = Object.assign({}, csDynamicChildreHelper);
        let dynchildhelperKey = dynchildhelper.name;

        let helperSqlCounter = 0;
        let fileName;
        if (dynchildhelper.filename != null) {
            fileName = dynchildhelper.filename;
        } else {
            fileName = util.format("%s.%s.sql", zeroFill(3, ++helperSqlCounter), slug(striptags(dynchildhelper.name)).toLowerCase());
        }
        helperSqlFiles.set(fileName, dynchildhelper.code);
        dynchildhelper.code_file = fileName;    

        delete dynchildhelper.filename;
        delete dynchildhelper.id;
        delete dynchildhelper.code;
        delete dynchildhelper.name;

        dynchildhelpers[dynchildhelperKey] = dynchildhelper;
    }

    return {
        dynchildhelpers,
        helperSqlFiles,
    };
}

function exportPolicyRules({ csPolicyRules }, { config }) {
    let policyRules = Object.assign({}, defaultConfigPolicyRules());
    for (let csPolicyRule of csPolicyRules) {
        let policyRuleKey = csPolicyRule.policy;
        let policyRule = policyRules[policyRuleKey];
        if (csPolicyRule && csPolicyRule.permission.toLowerCase() == "read") {
            policyRule.defaultRead = csPolicyRule.default_value;
        }
        if (csPolicyRule && csPolicyRule.permission.toLowerCase() == "write") {
            policyRule.defaultWrite = csPolicyRule.default_value;
        }
    }
    Object.assign(config, { policyRules });
}

function exportStructure({ csCatNodes, csCatLinks, csUgCatNodePerms }, {}) {
    let structureSqlFiles = new Map();
    let structure = [];

    let nodeReadPerms = [];
    let nodeWritePerms = [];
    for (let csUgCatNodePerm of csUgCatNodePerms) {
        let ug = util.format("%s@%s", csUgCatNodePerm.group, csUgCatNodePerm.domain);
        let nodeReadPermissions = nodeReadPerms[csUgCatNodePerm.cat_node_id];
        if (csUgCatNodePerm.permission === "read") {
            if (!nodeReadPermissions) {
                nodeReadPermissions = [];
                nodeReadPerms[csUgCatNodePerm.cat_node_id] = nodeReadPermissions;
            }
            nodeReadPermissions.push(ug);
        } else if (csUgCatNodePerm.permission === "write") {
            let nodeWritePermissions = nodeWritePerms[csUgCatNodePerm.cat_node_id];
            if (!nodeWritePermissions) {
                nodeWritePermissions = [];
                nodeWritePerms[csUgCatNodePerm.cat_node_id] = nodeWritePermissions;
            }
            nodeWritePermissions.push(ug);
        }
    }


    let allNodes = new Map();
    for (let csCatNode of csCatNodes) {
        let node = Object.assign({}, csCatNode);
        //delete node.derive_permissions_from_class;
        if (node.sql_sort === false) {
            delete node.sql_sort;
        }
        if (node.node_type === 'N') {
            delete node.node_type;
        }
        if (!node.table && node.derive_permissions_from_class === false) {
            delete node.derive_permissions_from_class;
        }

        clean(node);
        allNodes.set(node.id, node);
        if (node.is_root === true && node.node_type !== 'C') {
            structure.push(node);
        }
        delete node.is_root;

        //Permissions
        let readPerms = nodeReadPerms[node.id];
        if (readPerms) {
            node.readPerms = readPerms;
        }
        let writePerms = nodeWritePerms[node.id];
        if (writePerms) {
            node.writePerms = writePerms;
        }

    }

    let links = new Map();
    for (let csCatLink of csCatLinks) {
        let toLinks = links.get(csCatLink.id_from);
        if (!toLinks) {
            toLinks = [];
            links.set(csCatLink.id_from, toLinks);
        }
        if (csCatLink.id_from !== csCatLink.id_to) { //no direct recursions
            if (toLinks.indexOf(csCatLink.id_to) === -1) {
                toLinks.push(csCatLink.id_to);
            }
        }
    }

    let structureSqlCounter = 0;

    visitingNodesByChildren(structure, allNodes, links, []);

    // removing all orphan nodes
    for (let node of allNodes.values()) {
        let nodeId = node.id;
        if (nodeId) {
            logWarn(util.format("ignoring orphan node with id: %d", nodeId));
            allNodes.delete(nodeId);
        }
    }

    let sortedNodes = Array.from(allNodes.values());
    for (let node of sortedNodes) {        
        if (node.dynamic_children) {
            let fileName = node.dynamic_children_filename ?? util.format("%s.%s.sql", zeroFill(3, ++structureSqlCounter), slug(striptags(node.name)).toLowerCase());
            delete node.dynamic_children_filename;
            structureSqlFiles.set(fileName, node.dynamic_children);
            node.dynamic_children_file = fileName;        
            delete node.dynamic_children;
        }
    }

    return {
        structure,
        structureSqlFiles,
    };
}

function visitingNodesByChildren(nodes, allNodes, links, duplicates) {
    let childrenIdsVisited = [];
    for (let parent of nodes) {
        if (!parent) {
            continue;
        }
        let parentId = parent.id;
        childrenIdsVisited.push(parentId);                    

        let children = [];
        let childrenIds = links.get(parentId);
        delete parent.id;
        
        if (childrenIds) {
            for (let childId of childrenIds) {
                let child = allNodes.get(childId);
                if (child) {
                    if (child.id) {
                        children.push(child);
                    } else {
                        let key;
                        if (child.key) {
                            key = child.key;
                        } else {
                            duplicates.push(childId);
                            key = util.format("%s.%s", zeroFill(3, duplicates.length), slug(striptags(child.name)).toLowerCase());
                            child.key = key;
                        }
                        children.push( { link : key } );
                    }
                }
            }
        }
        if (children.length > 0) {
            childrenIdsVisited.push(... visitingNodesByChildren(children, allNodes, links, duplicates));            
            parent.children = children;
        }
    }
    return childrenIdsVisited;
}

function exportUsergroups({ csUgs }, { configurationAttributeValues }) {
    let usergroups = {};

    for (let csUg of csUgs) {
        let groupKey = csUg.name + (csUg.domain.toUpperCase() == 'LOCAL' ? '' : '@' + csUg.domain);
        let configurationAttributeValuesGroup = configurationAttributeValues.group[csUg.name + '@' + csUg.domain];

        let group = {
            descr: csUg.descr ?? undefined,
            prio: csUg.prio ?? undefined,
            configurationAttributes: configurationAttributeValuesGroup ?? undefined,
        };
        
        usergroups[groupKey] = group;
    }

    return {
        usergroups
    }
}

function exportUserManagement({ csUsrs, csUgMemberships }, { configurationAttributeValues }) {
    let userGroupMap = new Map();
    for (let csUgMembership of csUgMemberships) {
        let user = userGroupMap.get(csUgMembership.login_name);
        let gkey = csUgMembership.groupname + (csUgMembership.domainname.toUpperCase() == 'LOCAL' ? '' : '@' + csUgMembership.domainname)
        if (user) {
            user.push(gkey);
        } else {
            userGroupMap.set(csUgMembership.login_name, [gkey]);
        }
    }

    let usermanagement = {};

    for (let csUsr of csUsrs) {
        let user = Object.assign({}, csUsr);

        let userKey = user.login_name;        
        delete user.login_name;

        //add the usergroups
        let groups = userGroupMap.get(userKey);
        if (groups) {
            user.groups = groups;
        }

        //add the configuration attributes
        let configurationAttributeValuesUser = configurationAttributeValues.user[userKey];
        if (configurationAttributeValuesUser) {
            user.configurationAttributes = configurationAttributeValuesUser;
        }

        usermanagement[userKey] = user;
    }

    return {
        usermanagement
    }
}

// ---

const additionalInfosExportStatement = `
SELECT 
	type,
	key,
	json
FROM cs_info;
`;

const configAttrValuesExportStatement = `
SELECT 
    usr.login_name,
    domain.name AS domainname,
    ug.name || '@' || ug_domain.name AS groupkey,
    key.key,
    value.value,
    value.filename
FROM 
    cs_config_attr_jt AS jt
    INNER JOIN cs_config_attr_key key ON jt.key_id = key.id
    INNER JOIN cs_config_attr_value value ON jt.val_id = value.id
    LEFT OUTER JOIN cs_domain AS domain ON jt.dom_id = domain.id
    LEFT OUTER JOIN cs_usr AS usr ON jt.usr_id = usr.id
    LEFT OUTER JOIN cs_ug AS ug ON jt.ug_id = ug.id
    LEFT OUTER JOIN cs_domain AS ug_domain ON ug.domain = ug_domain.id
ORDER BY jt.id
;`;

const configAttrKeysExportStatement = `
SELECT DISTINCT
    key.key,
    type.type
FROM 
    cs_config_attr_jt AS jt
    INNER JOIN cs_config_attr_key key ON jt.key_id = key.id
    INNER JOIN cs_config_attr_type type ON jt.type_id = type.id
    ORDER BY key.key
;`;

const domainsExportStatement = 'SELECT name AS domainname FROM cs_domain ORDER BY id;';

const policyRulesExportStatement = `
SELECT cs_policy.name AS policy, cs_permission.key AS permission, default_value AS default_value
FROM cs_policy_rule, cs_policy, cs_permission 
WHERE 
    cs_policy_rule.policy = cs_policy.id 
    and cs_policy_rule.permission = cs_permission.id
ORDER BY cs_policy_rule.id;
`;

const usersExportStatement = ` 
SELECT 
    login_name, 
    TO_CHAR(last_pwd_change, 'DD.MM.YYYY, HH24:MI:SS') AS last_pwd_change, 
    trim(pw_hash) AS pw_hash, 
    trim(salt) AS salt
FROM cs_usr
ORDER BY id
;`;

const usergroupsExportStatement = `
SELECT 
    cs_domain.name AS domain,
    cs_ug.name AS name, 
    cs_ug.descr AS descr,
    cs_ug.prio AS prio
FROM cs_ug, cs_domain 
WHERE cs_ug.domain = cs_domain.id
ORDER BY cs_ug.id
;`;

const usergroupmembershipExportStatement = ` 
SELECT login_name, domainname, groupname
FROM (
    SELECT min(cs_ug_membership.id) AS id, cs_usr.login_name AS login_name, cs_domain.name AS domainname, cs_ug.name AS groupname
    FROM 
        cs_ug_membership cs_ug_membership 
        INNER JOIN cs_usr ON (cs_ug_membership.usr_id = cs_usr.id)
        INNER JOIN cs_ug ON (cs_ug_membership.ug_id = cs_ug.id) 
        INNER JOIN cs_domain ON (cs_domain.id = cs_ug.domain)
    GROUP BY cs_usr.login_name, cs_domain.name, cs_ug.name
) AS sub
ORDER BY id
;`;

const classesExportStatement = `
SELECT 
    c.table_name AS "table", 
    c.name AS "name",
    c.descr AS "descr",
    c.primary_key_field AS "pk",
    c.indexed AS "indexed",
    ci.file_name AS "classIcon", 
    oi.file_name AS "objectIcon", 
    null AS "icon",
    jcs.type AS "toStringType", 
    jcs.qualifier AS "toStringClass",
    jce.type AS "editorType", 
    jce.qualifier AS "editorClass",
    jcr.type AS "rendererType", 
    jcr.qualifier AS "rendererClass",
    c.array_link AS "array_link",
    cp.name AS "policy", 
    ap.name AS "attribute_policy",
    c.pos_attr AS "attributesOrder",
    cs_id.used_id AS "enforcedId",
    cs_id.reason AS "enforcedIdReason"
FROM 
    cs_class c 
    LEFT OUTER JOIN cs_id ON (cs_id.type='cs_class' AND cs_id.enforced_id IS TRUE AND cs_id.key=c.table_name)
    LEFT OUTER JOIN cs_icon ci ON (c.class_icon_id=ci.id)
    LEFT OUTER JOIN cs_icon oi ON (c.object_icon_id=oi.id)
    LEFT OUTER JOIN cs_java_class jcs on (c.tostring=jcs.id)
    LEFT OUTER JOIN cs_java_class jce on (c.editor=jce.id)
    LEFT OUTER JOIN cs_java_class jcr on (c.renderer=jcr.id)
    LEFT OUTER JOIN cs_policy cp on (c.policy=cp.id)
    LEFT OUTER JOIN cs_policy ap on (c.attribute_policy=ap.id)
ORDER BY c.id
;`;

const attributesExportStatement = `
SELECT 
    a.field_name field, a.name, c.table_name "table", a.descr,
    t.name "dbType",tc.table_name "cidsType",tc.table_name "oneToMany", tc.table_name "manyToMany", a.precision, a.scale, a.extension_attr, NOT a.optional mandatory, a.default_value "defaultValue",
    a.foreign_key, a.foreign_key_references_to "foreignKeyTableId", fkc.table_name foreignkeytable, a.substitute,
    NOT a.visible hidden, a.indexed,
    a.isarray "isArrray", a.array_key "arrayKey"
FROM 
    cs_attr a
    LEFT OUTER JOIN cs_class c ON (a.class_id=c.id)
    LEFT OUTER JOIN cs_type t ON (a.type_id=t.id)
    LEFT OUTER JOIN cs_class tc ON (t.class_id=tc.id)
    LEFT OUTER JOIN cs_class fkc ON (a.foreign_key_references_to=fkc.id)
ORDER BY
    c.table_name, a.pos
;`;

const classAttributesExportStatement = `
SELECT cs_class.table_name AS table, attr_key AS key, attr_value AS value 
FROM cs_class_attr
JOIN cs_class ON (cs_class.id = cs_class_attr.class_id)
ORDER BY cs_class_attr.id
;`;

const classPermissionsExportStatement = `
SELECT
    cs_domain.name AS domain, cs_ug.name AS group, cs_class.table_name AS table, cs_permission.key AS permission
FROM
    cs_ug_class_perm
    JOIN cs_permission ON (cs_permission.id = cs_ug_class_perm.permission)
    JOIN cs_class ON (cs_ug_class_perm.class_id = cs_class.id)
    JOIN cs_ug ON (cs_ug_class_perm.ug_id = cs_ug.id)
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
ORDER BY cs_ug_class_perm.id
;`;

const attributePermissionsExportStatement = `
SELECT
    cs_domain.name AS domain, cs_ug.name AS group, cs_class.table_name AS table, cs_attr.field_name AS field, cs_permission.key AS permission
FROM
    cs_ug_attr_perm 
    JOIN cs_permission ON (cs_permission.id = cs_ug_attr_perm.permission)
    JOIN cs_attr ON (cs_ug_attr_perm.attr_id = cs_attr.id)
    JOIN cs_class ON (cs_attr.class_id = cs_class.id)
    JOIN cs_ug ON (cs_ug_attr_perm.ug_id = cs_ug.id)
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
ORDER BY cs_ug_attr_perm.id
;`;

const nodesExportStatement = `
SELECT 
    node.id, 
    node.name, 
    class.table_name AS table, 
    node.derive_permissions_from_class, 
    node.object_id, 
    node.node_type, 
    node.is_root, 
    node.org, 
    CASE WHEN url.id IS NOT NULL THEN url_base.prot_prefix || url_base.server || url_base.path || url.object_name ELSE node.url END AS url,
    node.dynamic_children, 
    node.dynamic_children_filename,
    node.sql_sort, 
    policy.name AS policy, 
    node.iconfactory, 
    node.icon, 
    node.artificial_id
FROM
    cs_cat_node AS node
    LEFT OUTER JOIN url ON (node.descr = url.id) 
    LEFT OUTER JOIN url_base ON (url.url_base_id = url_base.id) 
    LEFT OUTER JOIN cs_class AS class ON node.class_id = class.id
    LEFT OUTER JOIN cs_policy AS policy ON node.policy = policy.id
ORDER BY node.id
;`;

const dynchildhelpersExportStatement = `
SELECT id, trim(name) AS name, code, filename
FROM cs_dynamic_children_helper
ORDER BY id    
;`;

const linksExportStatement = `
SELECT 
    id_from, id_to, org 
FROM 
    cs_cat_link
;`;

const nodePermissionsExportStatement = `
SELECT 
    d.name "domain", g.name "group", cnp.cat_node_id, p."key" "permission"
FROM 
    cs_ug_cat_node_perm cnp
    JOIN cs_permission p ON (p.id=cnp.permission)
    JOIN cs_ug g ON (cnp.ug_id=g.id)
    JOIN cs_domain d ON (g.domain=d.id)
ORDER BY g.name, d.name, p.key
;`;
