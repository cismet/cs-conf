import util from 'util';
import * as stmnts from './import/statements';
import prepareDomains from './import/domains';
import preparePolicyDefaults from './import/policyDefaults';
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
import { getClientForConfig, setIdsFromOrder, singleRowFiller, nestedFiller } from './tools/db';

async function csImport(options) {
    let { folder, recreate, execute, init, skipBackup, backupPrefix, backupFolder, schema, configDir } = options;
        
    let {
        domains, 
        policyRules, 
        usergroups, 
        usermanagement, 
        classes, 
        classPerms, 
        //normalizedClassPerms, 
        attrPerms, 
        //normalizedAttrPerms, 
        structure, 
        dynchildhelpers,
        xmlFiles,
        structureSqlFiles,
        helperSqlFiles
    } = readConfigFiles(folder);

    // Prepare =======================================================================================================

    console.log("preparing domains");
    let { 
        csDomainEntries 
    } = prepareDomains(domains);

    console.log("preparing policyRules");
    let { 
        csPolicyRulesEntries 
    } = preparePolicyDefaults(policyRules);

    console.log("preparing usergroups");
    let { 
        csUgEntries 
    } = prepareUsergroups(usergroups);

    console.log("preparing usermanagement");
    let { 
        csUserEntries, 
        csUgMembershipEntries 
    } = prepareUsermanagement(usermanagement);

    console.log("preparing configuration attributes");
    let { 
        csConfigAttrKeyEntries, 
        csConfigAttrValues4A, 
        csConfigAttrValues4CandX , 
        csConfigAttrValueEntriesArray
    } = prepareConfigAttrs(domains, usergroups, usermanagement, xmlFiles);

    console.log("preparing classes");
    let { csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries
    } = prepareClasses(classes);

    console.log("preparing class permissions");
    let { 
        csClassPermEntries 
    } = prepareClassPermissions(classPerms);             

    console.log("preparing attribute permissions");
    let { 
        csAttrPermEntries 
    } = prepareAttributePermissions(attrPerms);    

    console.log("preparing structure");
    let {
        csCatNodeEntries,
        csCatLinkEntries,
        csCatNodePermEntries,
        csDynamicChildrenHelperEntries
    } = prepareStructure(structure, structureSqlFiles, dynchildhelpers, helperSqlFiles);

    // Execution ---------------------------------

    if (execute) {
        let client;
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("loading config %s", configDir));
            client = getClientForConfig(configDir);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }

        if (!skipBackup) {
            let backupFileName = await csBackup({
                folder: backupFolder, 
                prefix: backupPrefix, 
                configDir,
                client
            });
            console.log(util.format(" ↳ %s", backupFileName));
        }

        if (recreate) {            
            console.log("purge and recreate cs_tables");
            await client.query(await csCreate({
                purge: true, 
                init: true, 
                execute: false, 
                silent: true, 
                schema, 
                configDir
            }));
        } else {
            console.log("truncate cs_tables");
            await client.query(await csTruncate({
                execute: false, 
                init: true, 
                silent: true, 
                configDir
            }));
        }

        // Normalize ====================================================================================================

        setIdsFromOrder(csDomainEntries);
        setIdsFromOrder(csPolicyRulesEntries);
        setIdsFromOrder(csUgEntries);
        setIdsFromOrder(csUserEntries);
        setIdsFromOrder(csClassEntries);
        setIdsFromOrder(csClassAttrEntries);
        setIdsFromOrder(csClassPermEntries);
        setIdsFromOrder(csAttrPermEntries);
        setIdsFromOrder(csDynamicChildrenHelperEntries);
        //setIdsFromOrder(csCatNodeEntries);

        // Import =======================================================================================================

        if (csDomainEntries.length > 0) {
            await singleRowFiller(client, stmnts.simple_cs_domain, csDomainEntries);    
        }
        if (csPolicyRulesEntries.length > 0) {
            console.log(util.format("importing policy rules (%d)", csPolicyRulesEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_policy_rules, csPolicyRulesEntries);
        }
        if (csUgEntries.length > 0) {
            console.log(util.format("importing user groups (%d)", csUgEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_ug, csUgEntries);
        }
        if (csUserEntries.length > 0) {
            console.log(util.format("importing users with pw_hashes (%d)", csUserEntries.length));
            await client.query("ALTER TABLE cs_usr DISABLE TRIGGER password_trigger;");
            await singleRowFiller(client, stmnts.simple_cs_usr, csUserEntries);
            await client.query("ALTER TABLE cs_usr ENABLE TRIGGER password_trigger;");        
        }
        if (csUgMembershipEntries.length > 0) {
            console.log(util.format("importing memberships (%d)", csUgMembershipEntries.length));
            await nestedFiller(client, stmnts.nested_cs_ug_membership, csUgMembershipEntries);
        }            
        if (csConfigAttrKeyEntries.length > 0) {
            console.log(util.format("importing config attribute keys (%d)", csConfigAttrKeyEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_config_attr_key, csConfigAttrKeyEntries);
        }
        if (csConfigAttrValueEntriesArray.length > 0) {
            console.log(util.format("importing config attributes values (%d)", csConfigAttrValueEntriesArray.length));
            await singleRowFiller(client, stmnts.simple_cs_config_attr_value, csConfigAttrValueEntriesArray);
        }
        if (csConfigAttrValues4A.length > 0) {
            console.log(util.format("importing action attributes (%d)", csConfigAttrValues4A.length));
            await nestedFiller(client, stmnts.complex_cs_config_attrs4A, csConfigAttrValues4A);
        }            
        if (csConfigAttrValues4CandX.length > 0) {
            console.log(util.format("importing config attributes (%d)", csConfigAttrValues4CandX.length));
            await nestedFiller(client, stmnts.complex_cs_config_attrs_C_X, csConfigAttrValues4CandX);
        }
        if (csIconEntries.length > 0) {
            console.log(util.format("importing icons (%d)", csIconEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_icon, csIconEntries);
        }
        if (csJavaClassEntries.length > 0) {        
            console.log(util.format("importing java classes (%d)", csJavaClassEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_java_class, csJavaClassEntries);
        }
        if (csClassEntries.length > 0) {                
            console.log(util.format("importing classes (%d)", csClassEntries.length));
            await nestedFiller(client, stmnts.complex_cs_class, csClassEntries);
        }
        if (csTypeEntries.length > 0) {                
            console.log(util.format("importing types (%d)", csTypeEntries.length));
            await nestedFiller(client, stmnts.complex_cs_type, csTypeEntries);       
        }
        if (csAttrDbTypeEntries.length > 0) {        
            console.log(util.format("importing simple attributes (%d)", csAttrDbTypeEntries.length));
            await nestedFiller(client, stmnts.complex_cs_attr4dbTypes, csAttrDbTypeEntries);        
        }
        if (csAttrCidsTypeEntries.length > 0) {        
            console.log(util.format("importing complex attributes (%d)", csAttrCidsTypeEntries.length));
            await nestedFiller(client, stmnts.complex_cs_attr4cidsTypes, csAttrCidsTypeEntries);       
        }
        if (csClassAttrEntries.length > 0) {        
            console.log(util.format("importing class attributes (%d)", csClassAttrEntries.length));
            await nestedFiller(client, stmnts.complex_cs_class_attr, csClassAttrEntries);        
        }
        if (csClassPermEntries.length > 0) {
            console.log(util.format("importing class permission (%d)", csClassPermEntries.length));
            await nestedFiller(client, stmnts.complex_cs_class_permission, csClassPermEntries);
        }           
        if (csAttrPermEntries.length > 0) {
            console.log(util.format("importing attribute permission (%d)", csAttrPermEntries.length));
            await dbtools.nestedFiller(client, stmnts.complex_cs_attr_permission, csAttrPermEntries);
        }               
        if (csCatNodeEntries.length > 0) {
            console.log(util.format("importing cat nodes (%d)", csCatNodeEntries.length));
            await nestedFiller(client, stmnts.complex_cs_cat_node, csCatNodeEntries);
        }                
        if (csCatLinkEntries.length > 0) {
            console.log(util.format("importing cat links (%d)", csCatLinkEntries.length));
            await nestedFiller(client, stmnts.complex_cs_cat_link, csCatLinkEntries);
        }                
        if (csCatNodePermEntries.length > 0) {
            console.log(util.format("importing cat node permissions (%d)", csCatNodePermEntries.length));
            await nestedFiller(client, stmnts.complex_cs_ug_cat_node_permission, csCatNodePermEntries);
        }                
        if (csDynamicChildrenHelperEntries.length > 0) {
            console.log(util.format("importing dynamic children helpers (%d)", csDynamicChildrenHelperEntries.length));
            await singleRowFiller(client, stmnts.simple_cs_dynamic_children_helper, csDynamicChildrenHelperEntries);
        }                
        console.log("(re)creating dynamic children helper functions");   
        await client.query(stmnts.execute_cs_refresh_dynchilds_functions);    

        if (!options.client) {
            await client.end();
        }
    } else {
        let cs = {
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
            csAttrDbTypeEntries, 
            csAttrCidsTypeEntries, 
            csClassPermEntries, 
            csAttrPermEntries, 
            csCatNodeEntries,
            csCatLinkEntries,
            csCatNodePermEntries,
            csDynamicChildrenHelperEntries
        }

        //console.table(cs);

        console.log("!!!!!!!!!!!!!");
        console.log("!!! ERROR !!! import disabled for security reasons. Use -I to force import.");
        console.log("!!!!!!!!!!!!!");
    }
}   

export default csImport;