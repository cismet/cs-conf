import util from 'util';

import { singleRowFiller, nestedFiller } from './tools/db';
import { getClientInfo, initClient } from './tools/db';
import { logDebug, logInfo, logOut, logVerbose, logWarn, topologicalSort } from './tools/tools';
import { readConfigFiles } from './tools/configFiles';
import { completeConfigAttr, extractGroupAndDomain } from './tools/cids';

import csCreate from './create';
import csTruncate from './truncate';
import csBackup from './backup';
import { normalizeConfigs } from './normalize';

export default async function csImport(options) {
    let { backupDir, backupPrefix, execute, init, recreate, skipBackup } = options;

    if (execute && !skipBackup && backupDir == null) throw Error("backupDir has to be set !");

    let configs = readConfigFiles(global.configsDir);

    logOut("Preparing import ...");
    let prepared = prepareImport(configs);

    let schema = global.config.schema;
    let client = await initClient(global.config.connection, execute);

    // Execution ---------------------------------

    if (execute) {
        let {
            csDomainEntries, 
            csPolicyRulesEntries, 
            csUgEntries, 
            csUserEntries, 
            csUgMembershipEntries, 
            csConfigAttrKeyEntries, 
            csConfigAttrValues4A, 
            csConfigAttrValues4CandX, 
            csConfigAttrValueEntriesArray, 
            csJavaClassEntries, 
            csIconEntries, 
            csClassAttrEntries, 
            csClassEntries, 
            csTypeEntries,
            csAttrDbTypeEntries, 
            csAttrCidsTypeEntries, 
            csClassPermEntries, 
            csAttrPermEntries, 
            csCatNodeEntries,
            csCatLinkEntries,
            csCatNodePermEntries,
            csDynamicChildrenHelperEntries,
            csInfoEntries,
        } = prepared;
    
        if (!skipBackup) {
            await csBackup({
                dir: backupDir, 
                prefix: backupPrefix, 
                client
            });
        } else {
            logVerbose("Skipping backup.");
        }

        logOut(util.format("Importing configuration to '%s' ...", getClientInfo()));

        await client.query('BEGIN;');

        if (recreate) {            
            logVerbose(" ↳ purging and recreating cs_tables");
            await client.query(await csCreate({
                purge: true, 
                init: true, 
                execute: false, 
                silent: true, 
                schema, 
            }));
        } else {
            logVerbose(" ↳ truncating cs_tables");
            await client.query(await csTruncate({
                execute: false, 
                init: true, 
                silent: true,
                client
            }));
        }                

        // Import =======================================================================================================

        if (csDomainEntries.length > 0) {
            logVerbose(util.format(" ↳ importing domains (%d)", csDomainEntries.length));
            await singleRowFiller(client, domainImportStatement, csDomainEntries);    
        }
        if (csUgEntries.length > 0) {
            logVerbose(util.format(" ↳ importing usergroups (%d)", csUgEntries.length));
            await singleRowFiller(client, usergroupsImportStatement, csUgEntries);
        }
        if (csUserEntries.length > 0) {
            logVerbose(util.format(" ↳ importing users (%d)", csUserEntries.length));
            await client.query("ALTER TABLE cs_usr DISABLE TRIGGER password_trigger;");
            await singleRowFiller(client, usersImportStatement, csUserEntries);
            await client.query("ALTER TABLE cs_usr ENABLE TRIGGER password_trigger;");        
        }
        if (csUgMembershipEntries.length > 0) {
            logVerbose(util.format(" ↳ importing user memberships (%d)", csUgMembershipEntries.length));
            await nestedFiller(client, usergroupmembershipImportStatement, csUgMembershipEntries);
        }            
        if (csConfigAttrKeyEntries.length > 0) {
            logVerbose(util.format(" ↳ importing config-attribute keys (%d)", csConfigAttrKeyEntries.length));
            await singleRowFiller(client, configAttrsImportStatement, csConfigAttrKeyEntries);
        }
        if (csConfigAttrValueEntriesArray.length > 0) {
            logVerbose(util.format(" ↳ importing config-attributes values (%d)", csConfigAttrValueEntriesArray.length));
            await singleRowFiller(client, configAttrValuesImportStatement, csConfigAttrValueEntriesArray);
        }
        if (csConfigAttrValues4A.length > 0) {
            logVerbose(util.format(" ↳ importing action-attributes (%d)", csConfigAttrValues4A.length));
            await nestedFiller(client, configAttrs4AImportStatement, csConfigAttrValues4A);
        }            
        if (csConfigAttrValues4CandX.length > 0) {
            logVerbose(util.format(" ↳ importing config-attributes (%d)", csConfigAttrValues4CandX.length));
            await nestedFiller(client, configAttrsCXImportStatement, csConfigAttrValues4CandX);
        }
        if (csPolicyRulesEntries.length > 0) {
            logVerbose(util.format(" ↳ importing policyRules (%d)", csPolicyRulesEntries.length));
            await singleRowFiller(client, policiesImportStatement, csPolicyRulesEntries);
        }
        if (csIconEntries.length > 0) {
            logVerbose(util.format(" ↳ importing icons (%d)", csIconEntries.length));
            await singleRowFiller(client, iconsImportStatement, csIconEntries);
        }
        if (csJavaClassEntries.length > 0) {        
            logVerbose(util.format(" ↳ importing java classes (%d)", csJavaClassEntries.length));
            await singleRowFiller(client, javaClassesImportStatement, csJavaClassEntries);
        }
        if (csClassEntries.length > 0) {                
            logVerbose(util.format(" ↳ importing classes (%d)", csClassEntries.length));
            await nestedFiller(client, classesImportStatement, csClassEntries);
        }
        if (csTypeEntries.length > 0) {                
            logVerbose(util.format(" ↳ importing types (%d)", csTypeEntries.length));
            await nestedFiller(client, typesImportStatement, csTypeEntries);       
        }
        if (csAttrDbTypeEntries.length > 0) {        
            logVerbose(util.format(" ↳ importing simple attributes (%d)", csAttrDbTypeEntries.length));
            await nestedFiller(client, attributesDbImportStatement, csAttrDbTypeEntries);        
        }
        if (csAttrCidsTypeEntries.length > 0) {        
            logVerbose(util.format(" ↳ importing complex attributes (%d)", csAttrCidsTypeEntries.length));
            await nestedFiller(client, attributesCidsImportStatement, csAttrCidsTypeEntries);       
        }
        if (csClassAttrEntries.length > 0) {        
            logVerbose(util.format(" ↳ importing class attributes (%d)", csClassAttrEntries.length));
            await nestedFiller(client, classAttributesImportStatement, csClassAttrEntries);        
        }
        if (csClassPermEntries.length > 0) {
            logVerbose(util.format(" ↳ importing class permission (%d)", csClassPermEntries.length));
            await nestedFiller(client, classPermissionsImportStatement, csClassPermEntries);
        }           
        if (csAttrPermEntries.length > 0) {
            logVerbose(util.format(" ↳ importing attribute permission (%d)", csAttrPermEntries.length));
            await dbtools.nestedFiller(client, attributePermissionsImportStatement, csAttrPermEntries);
        }               
        if (csCatNodeEntries.length > 0) {
            logVerbose(util.format(" ↳ importing cat-nodes (%d)", csCatNodeEntries.length));
            await nestedFiller(client, catalogueNodesImportStatement, csCatNodeEntries);
        }                
        if (csCatLinkEntries.length > 0) {
            logVerbose(util.format(" ↳ importing cat-links (%d)", csCatLinkEntries.length));
            await nestedFiller(client, catalogueLinksImportStatement, csCatLinkEntries);
        }                
        if (csCatNodePermEntries.length > 0) {
            logVerbose(util.format(" ↳ importing cat-node permissions (%d)", csCatNodePermEntries.length));
            await nestedFiller(client, nodePermissionsImportStatement, csCatNodePermEntries);
        }                
        if (csDynamicChildrenHelperEntries.length > 0) {
            logVerbose(util.format(" ↳ importing dynamic children helpers (%d)", csDynamicChildrenHelperEntries.length));
            await singleRowFiller(client, dynamicChildrenHelpersImportStatement, csDynamicChildrenHelperEntries);
        }                
        if (csInfoEntries.length > 0) {
            logVerbose(util.format(" ↳ importing additional infos (%d)", csInfoEntries.length));
            await singleRowFiller(client, additionalInfosImportStatement, csInfoEntries);
        }                
        logVerbose(" ↳ (re)creating dynamic children helper functions");   
        await client.query("SELECT cs_refresh_dynchilds_functions();");    
        await client.query('COMMIT;');
    } else {
        logDebug(prepared, { table: true });

        logInfo("DRY RUN ! Nothing happend yet. Use -X to execute import.");
    }
}   

export function prepareImport(configs) {
    logVerbose(" ↳ normalizing configuration");
    let normalizedConfigs = Object.assign(
        {
            configurationAttributes: {},
        },
        normalizeConfigs(configs)
    );

    let csEntries = {};

    logVerbose(util.format(" ↳ preparing policyRules (%d)", Object.keys(normalizedConfigs.config.policyRules).length));
    Object.assign(csEntries, preparePolicyRules(normalizedConfigs));
    
    logVerbose(util.format(" ↳ preparing domains (%d)", Object.keys(normalizedConfigs.domains).length));
    Object.assign(csEntries, prepareDomains(normalizedConfigs));

    logVerbose(util.format(" ↳ preparing usergroups (%d)", Object.keys(normalizedConfigs.usergroups).length));
    Object.assign(csEntries, prepareUsergroups(normalizedConfigs));

    logVerbose(util.format(" ↳ preparing usermanagement (%d)", Object.keys(normalizedConfigs.usermanagement).length));
    Object.assign(csEntries, prepareUsermanagement(normalizedConfigs));

    logVerbose(util.format(" ↳ preparing configuration attributes (%d)", Object.keys(normalizedConfigs.configurationAttributes).length));
    Object.assign(csEntries, prepareConfigAttrs(normalizedConfigs));

    logVerbose(util.format(" ↳ preparing classes (%d)", Object.keys(normalizedConfigs.classes).length));
    Object.assign(csEntries, prepareClasses(normalizedConfigs));

    logVerbose(util.format(" ↳ preparing structure (%d)", normalizedConfigs.structure.length));
    Object.assign(csEntries, prepareStructure(normalizedConfigs));

    let additionalInfoCount = 0;
    for (let additionalInfoType of Object.keys(normalizedConfigs.additionalInfos)) {
        let additionalInfo = normalizedConfigs.additionalInfos[additionalInfoType];
        additionalInfoCount += Object.keys(additionalInfo).length;
    }

    logVerbose(util.format(" ↳ preparing additionalInfos (%d)", additionalInfoCount));
    Object.assign(csEntries, prepareAdditionalInfos(normalizedConfigs));

    return csEntries;        
}

// ---

function prepareAdditionalInfos({ additionalInfos }) {
    let csInfoEntries = [];
    if (additionalInfos) {
        for (let type of Object.keys(additionalInfos)) {
            if (additionalInfos[type]) {
                for (let key of Object.keys(additionalInfos[type])) {
                    csInfoEntries.push([type, key, JSON.stringify(additionalInfos[type][key])]);
                }
            }
        }
    }
    return { csInfoEntries };
}

function createPermsEntry(groupkey, table, type, id) {
    const { group, domain } = extractGroupAndDomain(groupkey);
    return [
        group,
        domain,
        table,
        type,
        id,
    ];
}

function prepareClasses({ classes, additionalInfos }) {
    let csTypeEntries = [];
    let csJavaClassEntries = [];
    let icons = [];
    let csClassAttrEntries = [];
    let csClassEntries = [];
    let csAttrDbTypeEntries = [];
    let csAttrCidsTypeEntries = [];        
    let javaClasses = new Set();
    let csClassPermEntries = [];
    let csAttrPermEntries = [];

    for (let classKey of Object.keys(classes)) {
        let clazz = classes[classKey];
        let enforcedId = clazz.enforcedId;
        let enforcedIdReason = clazz.enforcedIdReason;
        let name = clazz.name;
        let descr = clazz.descr;
        let pk = clazz.pk;
        let array_link = clazz.array_link;
        let indexed = clazz.indexed;
        let policy = clazz.policy;
        let attributesOrder = clazz.attributesOrder;
        let attributePolicy = clazz.attribute_policy;
        let classIcon = clazz.classIcon;
        let objectIcon = clazz.objectIcon;
        let toStringClass = clazz.toString != null ? clazz.toString.class : null;
        let toStringType = clazz.toString != null ? clazz.toString.type : null;
        let editorClass = clazz.editor != null ? clazz.editor.class : null;
        let editorType = clazz.editor != null ? clazz.editor.type : null;
        let rendererClass = clazz.renderer != null ? clazz.renderer.class : null;
        let rendererType = clazz.renderer != null ? clazz.renderer.type : null;

        if (classIcon != null && !icons.includes(classIcon)) {
            icons.push(classIcon);
        }

        if (objectIcon != null && !icons.includes(objectIcon)) {
            icons.push(objectIcon);
        }

        if (clazz.toString != null) {
            let fullKey = util.format("%s.%s", clazz.toString.type, clazz.toString.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.toString.class != null && clazz.toString.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.toString.class,
                        clazz.toString.type
                    ]);
                }
            }
        }

        if (clazz.editor != null) {
            let fullKey = util.format("%s.%s", clazz.editor.type, clazz.editor.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.editor.class != null && clazz.editor.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.editor.class,
                        clazz.editor.type
                    ]);
                }
            }
        }

        if (clazz.renderer != null) {
            let fullKey = util.format("%s.%s", clazz.renderer.type, clazz.renderer.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.renderer.class != null && clazz.renderer.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.renderer.class,
                        clazz.renderer.type
                    ]);
                }
            }
        }

        if (clazz.readPerms) {
            for (let groupkey of clazz.readPerms) {
                csClassPermEntries.push(createPermsEntry(groupkey, classKey, "read", csClassPermEntries.length + 1));
            }
        }
        if (clazz.writePerms) {
            for (let groupkey of clazz.writePerms) {
                csClassPermEntries.push(createPermsEntry(groupkey, classKey, "write", csClassPermEntries.length + 1));
            }
        }  

        csClassEntries.push([
            name, 
            descr, 
            classIcon, 
            objectIcon, 
            classKey,
            pk,
            indexed,
            toStringClass,
            toStringType,
            editorClass,
            editorType,
            rendererClass,
            rendererType,
            array_link,
            policy,
            attributePolicy,
            attributesOrder,
            enforcedId,
            enforcedId ? enforcedIdReason ?? 'enforced by cs-conf' : null,
        ]);

        //For Types
        csTypeEntries.push([
            name, 
            classKey
        ]);

        if (Object.keys(clazz.additional_info).length > 0) {
            additionalInfos.class[classKey] = Object.assign({}, clazz.additional_info);
        }        

        let posCounter = 0;
        let attributes = clazz.attributes;
        for (let attributeKey of Object.keys(attributes)) {
            let attribute = attributes[attributeKey];
            let isArray = false;
            let xx = 1;
            let name = attribute.name;
            let substitute = attribute.substitute;
            let descr = attribute.descr;
            let visible = !attribute.hidden;
            let indexed = attribute.indexed;
            let arrayKey = attribute.arrayKey;
            let optional = !attribute.mandatory;
            let editorClass = attribute.editor != null ? attribute.editor.class : null;
            let editorType = attribute.editor != null ? attribute.editor.type : null;
            let toStringClass =attribute.toString != null ? attribute.toString.class : null;
            let toStringType = attribute.toString != null ? attribute.toString.type : null;
            let complexEditorClass = attribute.complexEditor != null ? attribute.complexEditor.class : null;
            let complexEditortype = attribute.complexEditor != null ? attribute.complexEditor.type : null;
            let fromStringClass = attribute.fromString != null ? attribute.fromString.class : null;
            let fromStringType = attribute.fromString != null ? attribute.fromString.type : null;
            let defaultValue = attribute.defaultValue;
            let pos = posCounter;
            let precision = attribute.precision;
            let scale = attribute.scale;
            let extensionAttribute = attribute.extension_attr; 

            let foreign_key;
            let foreign_key_references_to_table_name;
            let type_name;
            if (attribute.dbType) {
                foreign_key = false;    
                type_name = attribute.dbType;
            } else if (attribute.cidsType) {
                foreign_key = true;
                type_name = attribute.cidsType;
                // Takes the info out of the type
                // not needed
                foreign_key_references_to_table_name = attribute.cidsType; //TODO
            } else if (attribute.manyToMany) {
                foreign_key = true;
                isArray = true;
                type_name = attribute.manyToMany;
                foreign_key_references_to_table_name = attribute.manyToMany;
            } else if (attribute.oneToMany) {
                foreign_key = true;
                type_name = attribute.oneToMany;
                xx = -1;
                isArray = false;
            }              

            if (attribute.readPerms) {
                for (let groupkey of attribute.readPerms) {
                    csAttrPermEntries.push(createPermsEntry(groupkey, classKey, "read", csAttrPermEntries.length + 1));
                }
            }
            if (attribute.writePerms) {
                for (let groupkey of attribute.writePerms) {
                    csAttrPermEntries.push(createPermsEntry(groupkey, classKey, "write", csAttrPermEntries.length + 1));
                }
            }  
    

            posCounter += 10;
            
            if (attribute.dbType) {
                csAttrDbTypeEntries.push([
                    classKey,
                    type_name,
                    name,
                    attributeKey,
                    foreign_key,
                    substitute,
                    foreign_key_references_to_table_name,
                    descr,
                    visible,
                    indexed,
                    isArray,
                    arrayKey,
                    editorClass,
                    editorType,
                    toStringClass,
                    toStringType,
                    complexEditorClass,
                    complexEditortype,
                    optional,
                    defaultValue,
                    fromStringClass,
                    fromStringType,
                    pos,
                    precision,
                    scale,
                    extensionAttribute
                ]);
            } else {                
                csAttrCidsTypeEntries.push([
                    classKey,
                    type_name,
                    name,
                    attributeKey,
                    foreign_key,
                    substitute,
                    foreign_key_references_to_table_name,
                    descr,
                    visible,
                    indexed,
                    isArray,
                    arrayKey,
                    editorClass,
                    editorType,
                    toStringClass,
                    toStringType,
                    complexEditorClass,
                    complexEditortype,
                    optional,
                    defaultValue,
                    fromStringClass,
                    fromStringType,
                    pos,
                    precision,
                    scale,
                    extensionAttribute,
                    xx
                ]);            
            }

            if (Object.keys(attribute.additional_info).length > 0) {
                additionalInfos.attribute[classKey + "." + attributeKey] = Object.assign({}, attribute.additional_info);
            }        
    
        }
        if (clazz.additionalAttributes){
            for (let additionalAttributes in clazz.additionalAttributes) {
                csClassAttrEntries.push([
                    classKey,
                    additionalAttributes,
                    clazz.additionalAttributes[additionalAttributes],
                    csClassAttrEntries.length + 1,
                ]);
            }
        }
    }

    const csIconEntries = []
    for (let i of icons){
        if (i) {
            csIconEntries.push([ i.substr(0, i.indexOf('.')), i ]);
        }
    }

    return { 
        csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries,
        csClassPermEntries,
        csAttrPermEntries,
     };
}

function prepareConfigAttrs({ xmlFiles, configurationAttributes }) {
    let csConfigAttrKeyEntries = []
    let csConfigAttrValueEntries = new Map([['true', ['true', null]]]);
    let csConfigAttrValues4A = []; //only action attrs
    let csConfigAttrValues4CandX = []; //normal configuration attrs and xml attributes
    
    if (configurationAttributes) {
        let id = 1;
        let duplicateKeyFinder = new Set();
        for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
            let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
            for (let configurationAttribute of configurationAttributeArray) {
                let type;
                if (configurationAttribute.value != null) {
                    type = 'C';
                } else if (configurationAttribute.xmlfile != null) {
                    type = 'X';
                } else {
                    type = 'A';
                }

                if (!duplicateKeyFinder.has(configurationAttributeKey)) {
                    csConfigAttrKeyEntries.push([configurationAttributeKey]);
                    duplicateKeyFinder.add(configurationAttributeKey);
                }

                if (type === 'X' || type === 'C') {
                    let value = (type === 'X') ? xmlFiles.get(configurationAttribute.xmlfile) : configurationAttribute.value;
                    let filename = (type === 'X') ? configurationAttribute.xmlfile : null;
                    csConfigAttrValueEntries.set(value, [ 
                        value, 
                        filename 
                    ]);
                    csConfigAttrValues4CandX.push([
                        configurationAttribute.domain, 
                        configurationAttribute.group, 
                        configurationAttribute.user, 
                        configurationAttributeKey, 
                        type, 
                        value,
                        id++, 
                    ]);
                } else {
                    csConfigAttrValues4A.push([
                        configurationAttribute.domain, 
                        configurationAttribute.group, 
                        configurationAttribute.user, 
                        configurationAttributeKey,
                        id++, 
                    ]);
                }   
            }
        }
    }
    let csConfigAttrValueEntriesArray = Array.from(csConfigAttrValueEntries.values());

    return { csConfigAttrKeyEntries, csConfigAttrValues4A, csConfigAttrValues4CandX , csConfigAttrValueEntriesArray};
}

function prepareDomains({ domains, configurationAttributes, additionalInfos }) {
    let csDomainEntries = [];
    for (let domainKey of Object.keys(domains)) {
        let domain = domains[domainKey];
        csDomainEntries.push([ 
            domainKey,
            csDomainEntries.length + 1,
        ]);

        let domainConfigurationAttribute = domain.configurationAttributes;
        if (domainConfigurationAttribute) {
            for (let configurationAttributeKey of Object.keys(domainConfigurationAttribute)) {
                let configurationAttributeArray = domainConfigurationAttribute[configurationAttributeKey];
                for (let configurationAttribute of configurationAttributeArray) {
                    configurationAttribute.domain = domainKey;
                    if (configurationAttributes[configurationAttributeKey]) {
                        configurationAttributes[configurationAttributeKey].push(configurationAttribute);
                    } else {
                        configurationAttributes[configurationAttributeKey] = [ configurationAttribute ];
                    }                    
                }
            } 
        }

        if (Object.keys(domain.additional_info).length > 0) {
            additionalInfos.domain[domainKey] = Object.assign({}, domain.additional_info);
        }        
    }
    return { csDomainEntries };
}

function preparePolicyRules({ config }) {
    let { policyRules } = config;
    let csPolicyRulesEntries = [];    
    for (let policyRuleKey of Object.keys(policyRules)) {
        let policyRule = policyRules[policyRuleKey];
        if (policyRule.defaultRead != null) {
            csPolicyRulesEntries.push([ 
                policyRuleKey, 
                "read", 
                policyRule.defaultRead,
                csPolicyRulesEntries.length + 1,
            ]);
        }
        if (policyRule.defaultWrite != null) {
            csPolicyRulesEntries.push([ 
                policyRuleKey, 
                "write", 
                policyRule.defaultWrite,
                csPolicyRulesEntries.length + 1,
            ]);
        }
    }
    return { csPolicyRulesEntries };
}

function flattenStructure(children, linkToNode, level = 0) {
    let flattenNodes = [];
    for (let node of children) { 
        node.root = level === 0;
        
        if (node.key != null) {
            linkToNode.set(node.key, node);
        }
        flattenNodes.push(node);
        if (node.children != null) {
            flattenNodes.push(... flattenStructure(node.children, linkToNode, level + 1));
        }
    } 
    return flattenNodes;
}

function prepareDataDynchilds(dynchildhelpers, helperSqlFiles) {
    let csDynamicChildrenHelperEntries = [];
    for (let dynchildhelperKey of Object.keys(dynchildhelpers)) {
        let dynchildhelper = dynchildhelpers[dynchildhelperKey];
        csDynamicChildrenHelperEntries.push([
            dynchildhelperKey, 
            helperSqlFiles.get(dynchildhelper.code_file),
            dynchildhelper.code_file,
            csDynamicChildrenHelperEntries.length + 1,
        ]);
    }
    return csDynamicChildrenHelperEntries;
}

function prepareCatNodes(nodes, structureSqlFiles) {    
    let csCatNodeEntries = [];

    for (let node of nodes) {
        if (node.link == null) {
            node.id = csCatNodeEntries.length;
            let catNode = [
                node.name,
                node.url,
                node.table,
                node.object_id,
                node.node_type,
                node.root,
                node.org,
                structureSqlFiles.get(node.dynamic_children_file),
                node.dynamic_children_file,
                node.sql_sort,
                node.policy,
                node.derive_permissions_from_class,
                node.iconfactory,
                node.icon,
                node.artificial_id,
                node.id          
            ];
            csCatNodeEntries.push(catNode);
            delete node.root;
        }
    }
    return csCatNodeEntries;
}

function generateCsCatLinkEntries(node, linkToNode) {
    let csCatLinkEntries = [];
    if (node.children != null) {
        for (let child of node.children) {
            let catLink = [ node.id, child.link != null ? linkToNode.get(child.link).id : child.id ];
            csCatLinkEntries.push(catLink);    
            csCatLinkEntries.push(... generateCsCatLinkEntries(child, linkToNode));
        }
    }    
    return csCatLinkEntries;
}

function prepareCatLinks(structure, linkToNode) {
    let csCatLinkEntries = [];
    for (let parent of structure) { 
        csCatLinkEntries.push(... generateCsCatLinkEntries(parent, linkToNode));
    }
    return csCatLinkEntries;
}

function prepareCatNodePerms(nodes) {
    let csCatNodePermEntries=[];
    for (let node of nodes) {
        if (node.readPerms != null) {
            for (let groupkey of node.readPerms) {
                let {group, domain} = extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.id,
                    "read"
            ]);
            }
        }
        if (node.writePerms != null) {
            for (let groupkey of node.writePerms){
                let {group, domain} = extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.id,
                    "write"
                ]);
            }
        }
    }
    return csCatNodePermEntries;
}

function prepareStructure({ structure, structureSqlFiles, dynchildhelpers, helperSqlFiles }) {
    let linkToNode = new Map();
    let nodes = flattenStructure(structure, linkToNode);

    let csCatNodeEntries = prepareCatNodes(nodes, structureSqlFiles);
    let csCatLinkEntries = prepareCatLinks(structure, linkToNode);
    let csCatNodePermEntries = prepareCatNodePerms(nodes);
    let csDynamicChildrenHelperEntries = prepareDataDynchilds(dynchildhelpers, helperSqlFiles);

    return {
        csCatNodeEntries,
        csCatLinkEntries,
        csCatNodePermEntries,
        csDynamicChildrenHelperEntries
    };
}

function prepareUsergroups({ usergroups, configurationAttributes, additionalInfos }) {
    let csUgEntries = [];
    for (let groupKey of Object.keys(usergroups)) {
        let group = usergroups[groupKey];
        let groupKeySplit = groupKey.split('@');        
        let groupName = groupKeySplit[0];
        let domainKey = groupKeySplit[1];
        let descr = group.descr;
        let prio = group.prio;        
        csUgEntries.push([ 
            groupName, 
            descr, 
            domainKey, 
            prio,
            csUgEntries.length + 1,
        ]);

        let groupConfigurationAttributes = group.configurationAttributes;
        if (groupConfigurationAttributes) {
            let groupAndDomain = extractGroupAndDomain(groupKey);
            for (let configurationAttributeKey of Object.keys(groupConfigurationAttributes)) {
                let configurationAttributeArray = groupConfigurationAttributes[configurationAttributeKey];
                for (let configurationAttribute of configurationAttributeArray) {
                    configurationAttribute.group = groupAndDomain.group;
                    configurationAttribute.domain = groupAndDomain.domain;
                    if (configurationAttributes[configurationAttributeKey]) {
                        configurationAttributes[configurationAttributeKey].push(configurationAttribute);
                    } else {
                        configurationAttributes[configurationAttributeKey] = [ configurationAttribute ];
                    }
                }
            }
        }

        if (Object.keys(group.additional_info).length > 0) {
                additionalInfos.group[groupKey] = Object.assign({}, group.additional_info);
        }        
    }
    return { csUgEntries };
}

function prepareUsermanagement({ usermanagement, configurationAttributes, additionalInfos }) {
    let csUserEntries = [];
    let csUgMembershipEntries = [];

    let unshadowed = unshadowUsermanagement(usermanagement);

    for (let userKey of Object.keys(unshadowed)) {
        let user = unshadowed[userKey];
        csUserEntries.push([ 
            userKey, 
            user.pw_hash, 
            user.salt,
            user.last_pwd_change,
            csUserEntries.length + 1,
        ]);
        if (user.groups) {
            for (let group of user.groups) {
                let groupAndDomain = group.split('@');        
                let groupName = groupAndDomain[0];
                let domainKey = groupAndDomain[1];
                csUgMembershipEntries.push([
                    groupName, 
                    userKey, 
                    domainKey,
                    csUgMembershipEntries.length + 1,
                ]);
            }
        }

        let userConfigurationAttributes = user.configurationAttributes;
        if (userConfigurationAttributes) {            
            for (let configurationAttributeKey of Object.keys(userConfigurationAttributes)) {
                let configurationAttributeArray = userConfigurationAttributes[configurationAttributeKey];
                for (let configurationAttribute of configurationAttributeArray) {
                    if (configurationAttribute.groups != null && configurationAttribute.groups.length > 0) {
                        for (let group of configurationAttribute.groups) {
                            let groupAndDomain = extractGroupAndDomain(group);   
                            let groupKey = groupAndDomain != null ? groupAndDomain.group : null;
                            let domainKey = groupAndDomain != null ? groupAndDomain.domain : 'LOCAL';
                            let pushConfigurationAttribute = Object.assign({}, configurationAttribute, {
                                user: userKey,
                                group: groupKey,
                                domain: domainKey,
                            });
                            if (configurationAttributes[configurationAttributeKey]) {
                                configurationAttributes[configurationAttributeKey].push(pushConfigurationAttribute);
                            } else {
                                configurationAttributes[configurationAttributeKey] = [ pushConfigurationAttribute ];
                            }
        
                        }
                    } else {
                        let pushConfigurationAttribute = Object.assign({}, configurationAttribute, {
                            user: userKey,
                            domain: 'LOCAL',
                        });
                        if (configurationAttributes[configurationAttributeKey]) {
                            configurationAttributes[configurationAttributeKey].push(pushConfigurationAttribute);
                        } else {
                            configurationAttributes[configurationAttributeKey] = [ pushConfigurationAttribute ];
                        }
                    }
                }
            }
        }

        if (Object.keys(user.additional_info).length > 0) {
            additionalInfos.user[userKey] = Object.assign({}, user.additional_info);
        }
    }
    return { csUserEntries, csUgMembershipEntries };
}

export function unshadowUsermanagement(usermanagement) {
    let unshadowed = {};

    let shadowDependencyGraph = Object.keys(usermanagement).reduce((graphed, userKey) => (graphed[userKey] = usermanagement[userKey].shadows, graphed), {});           
    let dependencySortedUsers = topologicalSort(shadowDependencyGraph);
    for (let userKey of dependencySortedUsers) {
        let unshadowedUser = unshadowUser(userKey, usermanagement);
        unshadowed[userKey] = unshadowedUser;
    }

    return unshadowed;
}

export function unshadowUser(userKey, usermanagement) {      
    let user = usermanagement[userKey];

    if (user == null) throw Error(util.format("user '%s' not found", userKey));

    let users = [...user.shadows];
    let ownGroups = [...user.groups];
    let ownConfigurationAttributes = Object.assign({}, user.configurationAttributes);

    let _shadow = user.shadows.length > 0 ? {
        users,
        ownGroups,
        ownConfigurationAttributes,
    } : undefined;

    let groups = [...user.groups];
    let configurationAttributes = Object.assign({}, user.configurationAttributes);
    let additionalInfo = user.additional_info ? Object.assign({}, user.additional_info) : {};

    if (_shadow) {             
        for (let shadowKey of [..._shadow.users]) {
            let shadowUser = usermanagement[shadowKey];

            if (shadowUser && shadowUser.groups) {
                groups.push(...shadowUser.groups);
            }

            if (shadowUser && shadowUser.configurationAttributes) {
                completeConfigAttr(configurationAttributes, shadowUser.configurationAttributes, shadowKey);
            }
        }
        Object.assign(additionalInfo, { _shadow });
    }

    let unshadowed = Object.assign({}, user, {
        groups,
        configurationAttributes,
        additional_info: additionalInfo,
    });

    return unshadowed;
}

// ---

const additionalInfosImportStatement = `
INSERT INTO cs_info (type, key, json) VALUES ($1, $2, $3::jsonb);
`;


const domainImportStatement = `
INSERT INTO cs_domain (name, id) VALUES ($1, $2);
`;

const policiesImportStatement = `
INSERT INTO cs_policy_rule (policy, permission, default_value, id) VALUES (
    (SELECT id FROM cs_policy WHERE name = $1),
    (SELECT id from cs_permission WHERE key = $2),
    $3,
    $4
);
`;

const usergroupsImportStatement = `
INSERT INTO cs_ug (name, descr, domain, prio, id) VALUES (
    $1, 
    $2, 
    (SELECT id FROM cs_domain WHERE name = $3), 
    $4,
    $5
);
`;

const usersImportStatement = `
INSERT INTO cs_usr (login_name, pw_hash, salt, last_pwd_change, id) VALUES (
    $1, 
    $2, 
    $3, 
    TO_TIMESTAMP($4, 'DD.MM.YYYY, HH24:MI:SS'), 
    $5
);
`;

const usergroupmembershipImportStatement = `
INSERT INTO cs_ug_membership (ug_id, usr_id, ug_domain, id) 
    SELECT cs_ug.id, cs_usr.id, cs_ug.domain, t.id FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]),
        UNNEST($4::integer[])
    ) AS t(groupname, username, domainname, id) 
    JOIN cs_ug ON (cs_ug.name = groupname) 
    JOIN cs_usr ON (cs_usr.login_name = username)   
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
;
`;     

// $1 = cs_config_attr_key.key
const configAttrsImportStatement = `
INSERT INTO cs_config_attr_key (id, "key", group_name) VALUES (DEFAULT, $1, 'none');
`;

// $1 = domain[[]
// $2 = group[]
// $3 = user[]
// $4 = key[]
const configAttrs4AImportStatement = `
INSERT INTO cs_config_attr_jt (usr_id, ug_id, dom_id, key_id, val_id, type_id, id) 
    SELECT 
        cs_usr.id AS user_id, 
        cs_ug.id AS group_id,
        cs_domain.id AS domain_id, 
        cs_config_attr_key.id AS key_id, 
        cs_config_attr_value.id AS val_id,
        cs_config_attr_type.id AS type_id,
        t.id AS id
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]), 
        UNNEST($4::text[]),
        UNNEST($5::integer[])
    ) AS t(domainname, groupname, username, attrkey, id) 
    LEFT OUTER JOIN cs_domain ON (cs_domain.name = domainname) 
    LEFT OUTER JOIN cs_ug ON (cs_ug.name = groupname AND cs_ug.domain = cs_domain.id) 
    LEFT OUTER JOIN cs_usr ON (cs_usr.login_name = username)
    JOIN cs_config_attr_key ON (cs_config_attr_key.key = attrkey)
    JOIN cs_config_attr_type ON (cs_config_attr_type.type = 'A')
    JOIN cs_config_attr_value ON (cs_config_attr_value.value = 'true')
;
`;

const configAttrValuesImportStatement = `
INSERT INTO cs_config_attr_value (id, value, filename) VALUES (DEFAULT, $1, $2);
`;

// $1 = domain[[]
// $2 = group[]
// $3 = user[]
// $4 = key[]
// $5 = type[]
// $6 = value[]
const configAttrsCXImportStatement = `
INSERT INTO cs_config_attr_jt (usr_id, ug_id, dom_id, key_id, val_id, type_id, id) 
    SELECT
        cs_usr.id AS user_id, 
        cs_ug.id AS group_id,
        cs_domain.id AS domain_id, 
        cs_config_attr_key.id AS key_id, 
        cs_config_attr_value.id AS value_id, 
        cs_config_attr_type.id AS type_id,
        t.id AS id
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]), 
        UNNEST($4::text[]), 
        UNNEST($5::text[]), 
        UNNEST($6::text[]),
        UNNEST($7::integer[])
    ) AS t(domainname, groupname, username, attrkey, attrtype, attrvalue, id) 
    LEFT OUTER JOIN cs_domain ON (cs_domain.name = domainname) 
    LEFT OUTER JOIN cs_ug ON (cs_ug.name = groupname AND cs_ug.domain = cs_domain.id) 
    LEFT OUTER JOIN cs_usr ON (cs_usr.login_name = username)
    JOIN cs_config_attr_key ON (cs_config_attr_key.key = attrkey)
    JOIN cs_config_attr_type ON (cs_config_attr_type.type = attrtype)
    JOIN cs_config_attr_value ON (cs_config_attr_value.value = attrvalue)
;
`;

const iconsImportStatement = `
INSERT INTO cs_icon ("name", file_name) VALUES ($1, $2);
`;

const javaClassesImportStatement = `
INSERT INTO cs_java_class (qualifier, notice, "type") VALUES ($1, NULL, $2);
`;

const dynamicChildrenHelpersImportStatement = `
INSERT INTO cs_dynamic_children_helper (name, code, filename, id) VALUES ($1, $2, $3, $4);
`;

const classesImportStatement = `INSERT INTO cs_class (
    name, 
    descr, 
    class_icon_id, 
    object_icon_id, 
    table_name, 
    primary_key_field, 
    indexed, 
    tostring, 
    editor, 
    renderer, 
    array_link, 
    policy, 
    attribute_policy, 
    pos_attr,
    id
) SELECT 
    n, 
    d, 
    class_icons.id, 
    object_icons.id, 
    t, 
    pk, 
    i, 
    toStringClasses.id, 
    editorClasses.id, 
    rendererClasses.id, 
    a, 
    class_policy.id, 
    attribute_policy.id, 
    pa,
    CASE WHEN eid IS NOT NULL THEN getId('cs_class'::text, t, eid, eidr) ELSE getId('cs_class'::text, t) END
FROM (
    SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]),         
        UNNEST($4::text[]), 
        UNNEST($5::text[]), 
        UNNEST($6::text[]), 
        UNNEST($7::bool[]), 
        UNNEST($8::text[]), 
        UNNEST($9::text[]), 
        UNNEST($10::text[]), 
        UNNEST($11::text[]), 
        UNNEST($12::text[]), 
        UNNEST($13::text[]), 
        UNNEST($14::bool[]), 
        UNNEST($15::text[]), 
        UNNEST($16::text[]),
        UNNEST($17::text[]),
        UNNEST($18::integer[]),
        UNNEST($19::text[])
    ) AS t(n, d, ci, oi, t, pk, i, tsc, tst, ec, et, rc, rt, a, p, ap, pa, eid, eidr)
    LEFT OUTER JOIN cs_icon class_icons ON (ci=class_icons.file_name)
    LEFT OUTER JOIN cs_icon object_icons ON (oi=object_icons.file_name)
    LEFT OUTER JOIN cs_java_class toStringClasses ON (tsc=toStringClasses.qualifier AND tst=toStringClasses.type)
    LEFT OUTER JOIN cs_java_class editorClasses ON (ec=editorClasses.qualifier AND et=editorClasses.type)
    LEFT OUTER JOIN cs_java_class rendererClasses ON (rc=rendererClasses.qualifier AND rt=rendererClasses.type)
    LEFT OUTER JOIN cs_policy class_policy ON (p=class_policy.name)
    LEFT OUTER JOIN cs_policy attribute_policy ON (ap=attribute_policy.name)
    ORDER BY eid ASC NULLS LAST
;
`;

const typesImportStatement = `
INSERT INTO cs_type ("name", class_id, complex_type, descr, editor, renderer) 
    SELECT n, cs_class.id,true, null, null, null
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[])
    ) AS t(n, tn)
    JOIN cs_class ON (cs_class.table_name=tn)
;
`;

const attributesDbImportStatement = `
INSERT INTO cs_attr (
    class_id, type_id, "name", field_name, foreign_key, substitute, 
    foreign_key_references_to, descr, visible, indexed, isarray, 
    array_key, editor, tostring, complex_editor, optional, 
    default_value, from_string, pos, "precision", "scale", extension_attr
) 
    SELECT 
        cs_class.id,cs_type.id,n,fn,fk,s,
        foreign_key_class.id,d,v,i,arr,
        ak, editor_jc.id, toString_jc.id, complexeditor_jc.id, o,
        dv, fromString_jc.id,p,pr,sc,ea
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- type_name
        UNNEST($3::text[]), -- name
        UNNEST($4::text[]), -- fieldname
        UNNEST($5::bool[]), -- foreign_key
        UNNEST($6::bool[]), -- substitute
        UNNEST($7::text[]), -- foreign_key_references_to_table_name
        UNNEST($8::text[]), -- descr
        UNNEST($9::bool[]), -- visible
        UNNEST($10::bool[]), -- indexed
        UNNEST($11::bool[]), -- isarray
        UNNEST($12::text[]), -- array_key
        UNNEST($13::text[]), -- editor class
        UNNEST($14::text[]), -- editor type
        UNNEST($15::text[]), -- tostring class
        UNNEST($16::text[]), -- tostring type
        UNNEST($17::text[]), -- complex_editor class
        UNNEST($18::text[]), -- complex_editor type
        UNNEST($19::bool[]), -- optional
        UNNEST($20::text[]), -- default_value
        UNNEST($21::text[]), -- from_string class
        UNNEST($22::text[]), -- from_string type
        UNNEST($23::integer[]), -- pos
        UNNEST($24::integer[]), -- precision
        UNNEST($25::integer[]), -- scale
        UNNEST($26::bool[]) -- extension attribute
    ) AS t(t,tn,n,fn,fk,s,fktn,d,v,i,arr,ak,ec,et,tsc,tst,cec,cet,o,dv,fsc,fst,p,pr,sc,ea)
    JOIN cs_class ON (t=cs_class.table_name)
    JOIN cs_type ON (tn=cs_type.name)
    LEFT OUTER JOIN cs_class foreign_key_class ON (fktn=foreign_key_class.table_name)
    LEFT OUTER JOIN cs_java_class editor_jc ON (ec=editor_jc.qualifier AND et=editor_jc.type)
    LEFT OUTER JOIN cs_java_class toString_jc ON (tsc=toString_jc.qualifier AND tst=toString_jc.type)
    LEFT OUTER JOIN cs_java_class complexeditor_jc ON (cec=complexeditor_jc.qualifier AND cet=complexeditor_jc.type)
    LEFT OUTER JOIN cs_java_class fromString_jc ON (fsc=fromString_jc.qualifier AND fst=fromString_jc.type)
;
`;

const attributesCidsImportStatement = `
INSERT INTO cs_attr (
    class_id, type_id, "name", field_name, foreign_key, substitute, 
    foreign_key_references_to, descr, visible, indexed, isarray, 
    array_key, editor, tostring, complex_editor, optional, 
    default_value, from_string, pos, "precision", "scale", extension_attr
) 
    SELECT  
        cs_class.id ,cs_type.id,n,fn,fk,s,
        type_class.id*xx,d,v,i,arr,
        ak, editor_jc.id, toString_jc.id, complexeditor_jc.id, o,
        dv, fromString_jc.id,p,pr,sc,ea
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- type_name (4 cidsTypes the table_name of the foreign key table)
        UNNEST($3::text[]), -- name
        UNNEST($4::text[]), -- fieldname
        UNNEST($5::bool[]), -- foreign_key
        UNNEST($6::bool[]), -- substitute
        UNNEST($7::text[]), -- foreign_key_references_to_table_name
        UNNEST($8::text[]), -- descr
        UNNEST($9::bool[]), -- visible
        UNNEST($10::bool[]), -- indexed
        UNNEST($11::bool[]), -- isarray
        UNNEST($12::text[]), -- array_key
        UNNEST($13::text[]), -- editor class
        UNNEST($14::text[]), -- editor type
        UNNEST($15::text[]), -- tostring class
        UNNEST($16::text[]), -- tostring type
        UNNEST($17::text[]), -- complex_editor class
        UNNEST($18::text[]), -- complex_editor type
        UNNEST($19::bool[]), -- optional
        UNNEST($20::text[]), -- default_value
        UNNEST($21::text[]), -- from_string class
        UNNEST($22::text[]), -- from_string type
        UNNEST($23::integer[]), -- pos
        UNNEST($24::integer[]), -- precision
        UNNEST($25::integer[]), -- scale
        UNNEST($26::bool[]), -- extension attribute
        UNNEST($27::integer[]) -- -1 if oneToMany or 1 if else
    ) AS t(t,tn,n,fn,fk,s,fktn,d,v,i,arr,ak,ec,et,tsc,tst,cec,cet,o,dv,fsc,fst,p,pr,sc,ea,xx)
    JOIN cs_class ON (t=cs_class.table_name)
    JOIN cs_class type_class ON (tn=type_class.table_name)
    JOIN cs_type ON (cs_type.class_id=type_class.id)
    LEFT OUTER JOIN cs_java_class editor_jc ON (ec=editor_jc.qualifier AND et=editor_jc.type)
    LEFT OUTER JOIN cs_java_class toString_jc ON (tsc=toString_jc.qualifier AND tst=toString_jc.type)
    LEFT OUTER JOIN cs_java_class complexeditor_jc ON (cec=complexeditor_jc.qualifier AND cet=complexeditor_jc.type)
    LEFT OUTER JOIN cs_java_class fromString_jc ON (fsc=fromString_jc.qualifier AND fst=fromString_jc.type)
;
`;

const classAttributesImportStatement = `
INSERT INTO cs_class_attr (class_id, type_id, attr_key, attr_value, id) 
    SELECT 
        cs_class.id, cs_type.id, key, value, tid
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- attr_key
        UNNEST($3::text[]), -- attr_value
        UNNEST($4::integer[]) -- id
    )  AS t(tn, key, value, tid)
    JOIN cs_class ON (tn=cs_class.table_name)
    JOIN cs_type ON (cs_type.name='TEXT')
;
`;

const classPermissionsImportStatement = `
INSERT INTO cs_ug_class_perm (ug_id, class_id, permission, domain, id) 
    SELECT 
        cs_ug.id uid, cs_class.id cid, cs_permission.id pid, null, tid
    FROM (SELECT
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::text[]), -- table_name
        UNNEST($4::text[]), -- permission,
        UNNEST($5::integer[]) -- id
    )  AS t(g, d, t, p, tid)   
   JOIN cs_class ON (t=cs_class.table_name)
   JOIN cs_domain ON (d=cs_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND cs_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;

const attributePermissionsImportStatement = `
INSERT INTO cs_ug_attr_perm (ug_id, attr_id, permission, domain, id) 
    SELECT 
        cs_ug.id uid, cs_class.id cid, cs_permission.id pid, null, tid
    FROM (SELECT
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::text[]), -- table_name
        UNNEST($4::text[]), -- attribute
        UNNEST($5::text[]), -- permission
        UNNEST($6::integer[]) -- id
    )  AS t(g, d, t, a, p, tid)   
   JOIN cs_class ON (t=cs_class.table_name)
   JOIN cs_attr ON (a=cs_attr.field_name AND cs_attr.class_id=cs_class.id
   JOIN cs_domain ON (d=cs_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND cs_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;

const catalogueNodesImportStatement = `
INSERT INTO cs_cat_node (
    name, 
    url, 
    class_id, 
    object_id, 
    node_type, 
    is_root, 
    org, 
    dynamic_children, 
    dynamic_children_filename, 
    sql_sort, 
    policy, 
    derive_permissions_from_class, 
    iconfactory, 
    icon, 
    artificial_id, 
    id
) 
    SELECT     
        n, d, cs_class.id, oid, nt,
        ir, o, dc, dcfn, ss, cs_policy.id, 
        dpc, null, i, aid, tid
    FROM (SELECT
        UNNEST($1::text[]), -- name
        UNNEST($2::text[]), -- url
        UNNEST($3::text[]), -- table_name
        UNNEST($4::integer[]), -- object_id
        UNNEST($5::text[]), -- node_type
        UNNEST($6::bool[]), -- is_root
        UNNEST($7::text[]), -- org
        UNNEST($8::text[]), -- dynamic_children
        UNNEST($9::text[]), -- dynamic_children_filename
        UNNEST($10::bool[]), -- sql_sort
        UNNEST($11::text[]), -- policy
        UNNEST($12::bool[]), -- derive_permissions_from_class
        UNNEST($13::text[]), -- iconfactory
        UNNEST($14::text[]), -- icon
        UNNEST($15::text[]), -- artificial_id
        UNNEST($16::integer[]) -- id
    ) AS t(n, d, t, oid, nt, ir, o, dc, dcfn, ss, p, dpc, if, i, aid, tid)
    LEFT OUTER JOIN  cs_class ON (t = cs_class.table_name)
    LEFT OUTER JOIN cs_policy ON (p = cs_policy.name)
;
`;

const catalogueLinksImportStatement = `
INSERT INTO cs_cat_link (id_from, id_to, domain_to) 
    SELECT  f,t,cs_domain.id
    FROM ( SELECT
        UNNEST($1::integer[]), -- from
        UNNEST($2::integer[]) -- to
    ) as t(f,t)
    JOIN cs_domain ON (cs_domain.name='LOCAL')
;
`;

const nodePermissionsImportStatement = `
INSERT INTO cs_ug_cat_node_perm (ug_id, "domain", cat_node_id, "permission" ) 
    SELECT 
        cs_ug.id uid, node_domain.id, cnid, cs_permission.id pid
    FROM (SELECT 
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::integer[]), -- cat_node_id
        UNNEST($4::text[]) -- permission
    )  AS t(g,d,cnid,p)   
   JOIN cs_domain node_domain ON (node_domain.name='LOCAL')
   JOIN cs_domain group_domain ON (d=group_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND group_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;