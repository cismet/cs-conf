import util from 'util';
import * as stmnts from './import/statements';
import prepareDomains from './import/domains';
import preparePolicyRules from './import/policyRules';
import prepareUsergroups from './import/usergroups';
import prepareUsermanagement from './import/usermanagement';
import prepareConfigAttrs from './import/configAttrs';
import prepareClasses from './import/classes';
import prepareClassPermissions from './import/classPermissions';
import prepareAttributePermissions from './import/attrPermissions';
import prepareStructure from './import/structure';
import csCreate from './create';
import csTruncate from './truncate';
import csBackup from './backup';
import { readConfigFiles } from './tools/configFiles';
import { setIdsFromOrder, singleRowFiller, nestedFiller } from './tools/db';
import { normalizeConfig } from './normalize';
import { createClient, extractDbInfo, logDebug, logInfo, logOut, logVerbose, logWarn } from './tools/tools';

async function csImport(options) {
    let { configDir, recreate, execute, init, skipBackup, backupPrefix, backupFolder, schema, runtimePropertiesFile } = options;

    logVerbose(util.format("Reading configuration from '%s'", configDir));
    let config = readConfigFiles(configDir);
    logOut("Preparing import ...");
    let prepared = prepareImport(config);

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
            csDynamicChildrenHelperEntries
        } = prepared;
    
        let client;
        try {
            client = (options.client != null) ? options.client : await createClient(runtimePropertiesFile);
            
            if (!skipBackup) {
                await csBackup({
                    configDir: backupFolder, 
                    prefix: backupPrefix, 
                    runtimePropertiesFile,
                    client
                });
            } else {
                logVerbose("Skipping backup.");
            }

            logOut(util.format("Importing configuration to '%s' ...", extractDbInfo(client)));

            if (recreate) {            
                logVerbose(" ↳ purging and recreating cs_tables");
                await client.query(await csCreate({
                    purge: true, 
                    init: true, 
                    execute: false, 
                    silent: true, 
                    schema, 
                    runtimePropertiesFile
                }));
            } else {
                logVerbose(" ↳ truncating cs_tables");
                await client.query(await csTruncate({
                    execute: false, 
                    init: true, 
                    silent: true, 
                    runtimePropertiesFile
                }));
            }

            // Import =======================================================================================================

            if (csDomainEntries.length > 0) {
                logVerbose(util.format(" ↳ importing domains (%d)", csDomainEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_domain, csDomainEntries);    
            }
            if (csPolicyRulesEntries.length > 0) {
                logVerbose(util.format(" ↳ importing policyRules (%d)", csPolicyRulesEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_policy_rules, csPolicyRulesEntries);
            }
            if (csUgEntries.length > 0) {
                logVerbose(util.format(" ↳ importing usergroups (%d)", csUgEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_ug, csUgEntries);
            }
            if (csUserEntries.length > 0) {
                logVerbose(util.format(" ↳ importing users (%d)", csUserEntries.length));
                await client.query("ALTER TABLE cs_usr DISABLE TRIGGER password_trigger;");
                await singleRowFiller(client, stmnts.simple_cs_usr, csUserEntries);
                await client.query("ALTER TABLE cs_usr ENABLE TRIGGER password_trigger;");        
            }
            if (csUgMembershipEntries.length > 0) {
                logVerbose(util.format(" ↳ importing user memberships (%d)", csUgMembershipEntries.length));
                await nestedFiller(client, stmnts.nested_cs_ug_membership, csUgMembershipEntries);
            }            
            if (csConfigAttrKeyEntries.length > 0) {
                logVerbose(util.format(" ↳ importing config-attribute keys (%d)", csConfigAttrKeyEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_config_attr_key, csConfigAttrKeyEntries);
            }
            if (csConfigAttrValueEntriesArray.length > 0) {
                logVerbose(util.format(" ↳ importing config-attributes values (%d)", csConfigAttrValueEntriesArray.length));
                await singleRowFiller(client, stmnts.simple_cs_config_attr_value, csConfigAttrValueEntriesArray);
            }
            if (csConfigAttrValues4A.length > 0) {
                logVerbose(util.format(" ↳ importing action-attributes (%d)", csConfigAttrValues4A.length));
                await nestedFiller(client, stmnts.complex_cs_config_attrs4A, csConfigAttrValues4A);
            }            
            if (csConfigAttrValues4CandX.length > 0) {
                logVerbose(util.format(" ↳ importing config-attributes (%d)", csConfigAttrValues4CandX.length));
                await nestedFiller(client, stmnts.complex_cs_config_attrs_C_X, csConfigAttrValues4CandX);
            }
            if (csIconEntries.length > 0) {
                logVerbose(util.format(" ↳ importing icons (%d)", csIconEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_icon, csIconEntries);
            }
            if (csJavaClassEntries.length > 0) {        
                logVerbose(util.format(" ↳ importing java classes (%d)", csJavaClassEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_java_class, csJavaClassEntries);
            }
            if (csClassEntries.length > 0) {                
                logVerbose(util.format(" ↳ importing classes (%d)", csClassEntries.length));
                await nestedFiller(client, stmnts.complex_cs_class, csClassEntries);
            }
            if (csTypeEntries.length > 0) {                
                logVerbose(util.format(" ↳ importing types (%d)", csTypeEntries.length));
                await nestedFiller(client, stmnts.complex_cs_type, csTypeEntries);       
            }
            if (csAttrDbTypeEntries.length > 0) {        
                logVerbose(util.format(" ↳ importing simple attributes (%d)", csAttrDbTypeEntries.length));
                await nestedFiller(client, stmnts.complex_cs_attr4dbTypes, csAttrDbTypeEntries);        
            }
            if (csAttrCidsTypeEntries.length > 0) {        
                logVerbose(util.format(" ↳ importing complex attributes (%d)", csAttrCidsTypeEntries.length));
                await nestedFiller(client, stmnts.complex_cs_attr4cidsTypes, csAttrCidsTypeEntries);       
            }
            if (csClassAttrEntries.length > 0) {        
                logVerbose(util.format(" ↳ importing class attributes (%d)", csClassAttrEntries.length));
                await nestedFiller(client, stmnts.complex_cs_class_attr, csClassAttrEntries);        
            }
            if (csClassPermEntries.length > 0) {
                logVerbose(util.format(" ↳ importing class permission (%d)", csClassPermEntries.length));
                await nestedFiller(client, stmnts.complex_cs_class_permission, csClassPermEntries);
            }           
            if (csAttrPermEntries.length > 0) {
                logVerbose(util.format(" ↳ importing attribute permission (%d)", csAttrPermEntries.length));
                await dbtools.nestedFiller(client, stmnts.complex_cs_attr_permission, csAttrPermEntries);
            }               
            if (csCatNodeEntries.length > 0) {
                logVerbose(util.format(" ↳ importing cat-nodes (%d)", csCatNodeEntries.length));
                await nestedFiller(client, stmnts.complex_cs_cat_node, csCatNodeEntries);
            }                
            if (csCatLinkEntries.length > 0) {
                logVerbose(util.format(" ↳ importing cat-links (%d)", csCatLinkEntries.length));
                await nestedFiller(client, stmnts.complex_cs_cat_link, csCatLinkEntries);
            }                
            if (csCatNodePermEntries.length > 0) {
                logVerbose(util.format(" ↳ importing cat-node permissions (%d)", csCatNodePermEntries.length));
                await nestedFiller(client, stmnts.complex_cs_ug_cat_node_permission, csCatNodePermEntries);
            }                
            if (csDynamicChildrenHelperEntries.length > 0) {
                logVerbose(util.format(" ↳ importing dynamic children helpers (%d)", csDynamicChildrenHelperEntries.length));
                await singleRowFiller(client, stmnts.simple_cs_dynamic_children_helper, csDynamicChildrenHelperEntries);
            }                
            logVerbose(" ↳ (re)creating dynamic children helper functions");   
            await client.query(stmnts.execute_cs_refresh_dynchilds_functions);    
        } finally {
            if (options.client == null && client != null) {
                await client.end();
            }
        }
    } else {
        logDebug(prepared, { table: true });

        logInfo("DRY RUN ! Nothing happend yet. Use -X to execute import.");
    }
}   

export function prepareImport(config) {
    logVerbose(" ↳ normalizing configuration");
    let {
        domains, 
        policyRules, 
        usergroups, 
        usermanagement, 
        classes, 
        classPerms, 
        attrPerms, 
        structure, 
        dynchildhelpers,
        xmlFiles,
        structureSqlFiles,
        helperSqlFiles
    } = normalizeConfig(config);

    logVerbose(util.format(" ↳ preparing domains (%d)", domains.length));
    let { 
        csDomainEntries 
    } = prepareDomains(domains);

    logVerbose(util.format(" ↳ preparing policyRules (%d)", policyRules.length));
    let { 
        csPolicyRulesEntries 
    } = preparePolicyRules(policyRules);

    logVerbose(util.format(" ↳ preparing usergroups (%d)", usergroups.length));
    let { 
        csUgEntries 
    } = prepareUsergroups(usergroups);

    logVerbose(util.format(" ↳ preparing usermanagement (%d)", usermanagement.length));
    let { 
        csUserEntries, 
        csUgMembershipEntries 
    } = prepareUsermanagement(usermanagement);

    logVerbose(util.format(" ↳ preparing configuration attributes"));
    let { 
        csConfigAttrKeyEntries, 
        csConfigAttrValues4A, 
        csConfigAttrValues4CandX , 
        csConfigAttrValueEntriesArray
    } = prepareConfigAttrs(domains, usergroups, usermanagement, xmlFiles);

    logVerbose(util.format(" ↳ preparing classes (%d)", domains.length));
    let { csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries
    } = prepareClasses(classes);

    logVerbose(util.format(" ↳ preparing class permissions (%d)", classPerms.length));
    let { 
        csClassPermEntries 
    } = prepareClassPermissions(classPerms);             

    logVerbose(util.format(" ↳ preparing attribute permissions (%d)", attrPerms.length));
    let { 
        csAttrPermEntries 
    } = prepareAttributePermissions(attrPerms);    

    logVerbose(util.format(" ↳ preparing structure (%d)", structure.length));
    let {
        csCatNodeEntries,
        csCatLinkEntries,
        csCatNodePermEntries,
        csDynamicChildrenHelperEntries
    } = prepareStructure(structure, structureSqlFiles, dynchildhelpers, helperSqlFiles);
        
    setIdsFromOrder(csDomainEntries);
    setIdsFromOrder(csPolicyRulesEntries);
    setIdsFromOrder(csUgEntries);
    setIdsFromOrder(csUserEntries);
    setIdsFromOrder(csClassEntries);
    setIdsFromOrder(csClassAttrEntries);
    setIdsFromOrder(csClassPermEntries);
    setIdsFromOrder(csAttrPermEntries);
    setIdsFromOrder(csDynamicChildrenHelperEntries);
    setIdsFromOrder(csUgMembershipEntries);
    //setIdsFromOrder(csCatNodeEntries);

    return {
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
        csDynamicChildrenHelperEntries
    };
}

export default csImport;