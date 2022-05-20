import fs from 'fs';
import util from 'util';
import { extname } from 'path';

import importDomains from './import/domains';
import importPolicyDefaults from './import/policyDefaults';
import importUsergroups from './import/usergroups';
import importUsermanagement from './import/usermanagement';
import importConfigAttrs from './import/configAttrs';
import importClasses from './import/classes';
import importClassPermissions from './import/classPermissions';
import importStructure from './import/structure';
import * as constants from './tools/constants.js';
import { getClientForConfig } from './tools/db';

import * as csCreate from './create';
import * as csTruncate from './truncate';
import * as csBackup from './backup';

export async function worker(options) {
    let { folder, recreate, execute, init, skipBackup, backupPrefix, backupFolder, schema, config } = options;
    if (!fs.existsSync(folder)) {
        throw util.format("%s does not exist", folder);
    }
    if (execute) {
        let client;
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("loading config %s", config));
            client = await getClientForConfig(config);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }

        if (!skipBackup) {
            let options = {
                folder: backupFolder, 
                prefix: backupPrefix, 
                config: config,
                client: client
            };
            let backupFileName = await csBackup.worker(options);
            console.log(util.format(" ↳ %s", backupFileName));
        }

        if (recreate) {            
            console.log("purge and recreate cs_tables");
            let options = {
                purge: true, 
                init: true, 
                execute: false, 
                silent: true, 
                schema: schema, 
                config: config
            };
            await client.query(await csCreate.worker(options));
        } else {
            console.log("truncate cs_tables");
            let options = {
                execute: false, 
                init: true, 
                silent: true, 
                config: config
            };
            await client.query(await csTruncate.worker(options));
        }

        // read the conf-files

        const configfiles = {};
        configfiles.domains = JSON.parse(fs.readFileSync(util.format("%s/domains.json", folder), {encoding: 'utf8'}));
        configfiles.policy_rules = JSON.parse(fs.readFileSync(util.format("%s/policy_rules.json", folder), {encoding: 'utf8'}));
        configfiles.usergroups = JSON.parse(fs.readFileSync(util.format("%s/usergroups.json", folder), {encoding: 'utf8'}));
        configfiles.usermanagement = JSON.parse(fs.readFileSync(util.format("%s/usermanagement.json", folder), {encoding: 'utf8'}));
        configfiles.classes = JSON.parse(fs.readFileSync(util.format("%s/classes.json", folder), {encoding: 'utf8'}));
        configfiles.classPerms = JSON.parse(fs.readFileSync(util.format("%s/classPerms.json", folder), {encoding: 'utf8'}));
        configfiles.normalizedClassPerms = JSON.parse(fs.readFileSync(util.format("%s/normalizedClassPerms.json", folder), {encoding: 'utf8'}));
        configfiles.attrPerms = JSON.parse(fs.readFileSync(util.format("%s/attrPerms.json", folder), {encoding: 'utf8'}));
        configfiles.normalizedAttrPerms = JSON.parse(fs.readFileSync(util.format("%s/normalizedAttrPerms.json", folder), {encoding: 'utf8'}));
        configfiles.structure = JSON.parse(fs.readFileSync(util.format("%s/structure.json", folder), {encoding: 'utf8'}));
        configfiles.dynchildhelpers = JSON.parse(fs.readFileSync(util.format("%s/dynchildhelpers.json", folder), {encoding: 'utf8'}));

        configfiles.xmlFiles = new Map();
        let confAttrXmlSnippetsFolder = util.format("%s/%s", folder, constants.confAttrXmlSnippetsFolder);
        for (let file of fs.readdirSync(confAttrXmlSnippetsFolder)) {
            if (extname(file) == ".xml") {
                configfiles.xmlFiles.set(file, fs.readFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, file), {encoding: 'utf8'}));    
            }
        }    

        configfiles.structureSqlFiles=new Map();
        let structureDynamicChildrenFolder = util.format("%s/%s", folder, constants.structureDynamicChildrenFolder);
        for (let file of fs.readdirSync(structureDynamicChildrenFolder)) {
            if (extname(file) == ".sql") {
                configfiles.structureSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureDynamicChildrenFolder, file), {encoding: 'utf8'}));    
            }
        }    

        configfiles.helperSqlFiles=new Map();
        let structureHelperStatementsFolder = util.format("%s/%s", folder, constants.structureHelperStatementsFolder);
        for (let file of fs.readdirSync(structureHelperStatementsFolder)) {
            if (extname(file) == ".sql") {
                configfiles.helperSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureHelperStatementsFolder, file), {encoding: 'utf8'}));    
            }
        }    

        //Import =======================================================================================================

        //Domains -----------------------------------------------------------------------
        console.log("importing domains");
        await importDomains(client, configfiles.domains);

        // Policy defaults -----------------------------------------------------------------------
        console.log("importing policy_rules");
        await importPolicyDefaults(client, configfiles.policy_rules);

        // Usergroups -----------------------------------------------------------------------
        console.log("importing usergroups");
        await importUsergroups(client, configfiles.usergroups);

        // Usergroups -----------------------------------------------------------------------
        console.log("importing usermanagement");
        await importUsermanagement(client, configfiles.usermanagement);

        // ConfigAttrs -----------------------------------------------------------------------
        await importConfigAttrs(client, configfiles.domains, configfiles.usergroups, configfiles.usermanagement, configfiles.xmlFiles);
        
        // Classes -----------------------------------------------------------------------
        await importClasses(client, configfiles.classes);

        // Classpermissions -----------------------------------------------------------------------
        await importClassPermissions(client, configfiles.classPerms);
    
    // await importAttrPermissions(client, configfiles.classPerms);
        await importStructure(client, configfiles.structure, configfiles.structureSqlFiles, configfiles.dynchildhelpers, configfiles.helperSqlFiles);

        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }
    } else {
        console.log("!!!!!!!!!!!!!");
        console.log("!!! ERROR !!! import disabled for security reasons. Use -I to force import.");
        console.log("!!!!!!!!!!!!!");
    }
}   



    



