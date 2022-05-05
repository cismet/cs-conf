#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import glob from 'glob-promise';

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

        const configfiles={};
        configfiles.domains = JSON.parse(fs.readFileSync(folder+"/domains.json", {encoding: 'utf8'}));
        configfiles.policy_rules = JSON.parse(fs.readFileSync(folder+"/policy_rules.json", {encoding: 'utf8'}));
        configfiles.usergroups = JSON.parse(fs.readFileSync(folder+"/usergroups.json", {encoding: 'utf8'}));
        configfiles.usermanagement = JSON.parse(fs.readFileSync(folder+"/usermanagement.json", {encoding: 'utf8'}));
        configfiles.classes = JSON.parse(fs.readFileSync(folder+"/classes.json", {encoding: 'utf8'}));
        configfiles.classPerms = JSON.parse(fs.readFileSync(folder+"/classPerms.json", {encoding: 'utf8'}));
        configfiles.normalizedClassPerms = JSON.parse(fs.readFileSync(folder+"/normalizedClassPerms.json", {encoding: 'utf8'}));
        configfiles.attrPerms = JSON.parse(fs.readFileSync(folder+"/attrPerms.json", {encoding: 'utf8'}));
        configfiles.normalizedAttrPerms = JSON.parse(fs.readFileSync(folder+"/normalizedAttrPerms.json", {encoding: 'utf8'}));
        configfiles.structure = JSON.parse(fs.readFileSync(folder+"/structure.json", {encoding: 'utf8'}));
        configfiles.dynchildhelpers = JSON.parse(fs.readFileSync(folder+"/dynchildhelpers.json", {encoding: 'utf8'}));

        let xmlFolderPart=folder+"/"+ constants.confAttrXmlSnippetsFolder +"/"
        let xmlConfigs=await glob(xmlFolderPart+"*.xml");
        configfiles.xmlFiles=new Map();
        for (let xmlFile of xmlConfigs){
            let xml=fs.readFileSync(xmlFile, {encoding: 'utf8'});
            let onlyFileName=xmlFile.substr(xmlFolderPart.length);
            configfiles.xmlFiles.set(onlyFileName,xml);
        }

        let structureDynamicChildrenFolderPart=folder+"/"+ constants.structureDynamicChildrenFolder +"/"
        let structureHelperStatementsFolderPart=folder+"/"+ constants.structureHelperStatementsFolder +"/"

        let structureSqlDocuments= await glob(structureDynamicChildrenFolderPart + "/*.sql");
        let helperSqlDocuments= await glob(structureHelperStatementsFolderPart + "/*.sql");

        configfiles.structureSqlFiles=new Map();
        for (let sqlFile of structureSqlDocuments){
            let sql=fs.readFileSync(sqlFile, {encoding: 'utf8'});
            let onlyFileName=sqlFile.substr(structureDynamicChildrenFolderPart.length);

            configfiles.structureSqlFiles.set(onlyFileName,sql);
        }
        configfiles.helperSqlFiles=new Map();
        for (let sqlFile of helperSqlDocuments){
            let sql=fs.readFileSync(sqlFile, {encoding: 'utf8'});
            let onlyFileName=sqlFile.substr(structureHelperStatementsFolderPart.length);

            configfiles.helperSqlFiles.set(onlyFileName,sql);
        }

        //fs.writeFileSync(folder+"/all.json", stringify(configfiles, {maxLength:80}), "utf8");

        //Import =======================================================================================================

        //Domains -----------------------------------------------------------------------
        console.log("importing domains ...");
        await importDomains(client, configfiles.domains);

        // Policy defaults -----------------------------------------------------------------------
        console.log("importing policy_rules ...");
        await importPolicyDefaults(client, configfiles.policy_rules);

        // Usergroups -----------------------------------------------------------------------
        console.log("importing usergroups ...");
        await importUsergroups(client, configfiles.usergroups);

        // Usergroups -----------------------------------------------------------------------
        console.log("importing usermanagement ...");
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



    



