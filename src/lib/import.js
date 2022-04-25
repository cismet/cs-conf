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

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

export async function worker(folder, schema, config) {
    try {
        const client = await getClientForConfig(config);
        await client.connect();

        console.log("create chema (if not existing)");
        try {
            await client.query(" CREATE SCHEMA ${schema};"); //ditched IF NOT EXISTS due to backwards compatibility
            console.log("Schema created.")
        } catch (skip){
            console.log("Schema is already there.")
        }

        console.log("initialize schema");
        await client.query(`SET SCHEMA '${schema}';`);
        console.log("... drop");
        await client.query(fs.readFileSync('resources/cids-init/cids-drop.sql', 'utf8'));
        console.log("... create");
        await client.query(fs.readFileSync('resources/cids-init/cids-create.sql', 'utf8'));
        console.log("... init");
        await client.query(fs.readFileSync('resources/cids-init/cids-init.sql', 'utf8'));
        console.log("... truncate");
        await client.query(fs.readFileSync('resources/cids-init/cids-truncate.sql', 'utf8'));
        console.log("initialization done.");

        // read the conf-files

        const configfiles={};
        configfiles.domains= JSON.parse(await readFile(folder+"/domains.json", {encoding: 'utf8'}));
        configfiles.policy_rules= JSON.parse(await readFile(folder+"/policy_rules.json", {encoding: 'utf8'}));
        configfiles.usergroups= JSON.parse(await readFile(folder+"/usergroups.json", {encoding: 'utf8'}));
        configfiles.usermanagement= JSON.parse(await readFile(folder+"/usermanagement.json", {encoding: 'utf8'}));
        configfiles.classes= JSON.parse(await readFile(folder+"/classes.json", {encoding: 'utf8'}));
        configfiles.classPerms= JSON.parse(await readFile(folder+"/classPerms.json", {encoding: 'utf8'}));
        configfiles.normalizedClassPerms= JSON.parse(await readFile(folder+"/normalizedClassPerms.json", {encoding: 'utf8'}));
        configfiles.attrPerms= JSON.parse(await readFile(folder+"/attrPerms.json", {encoding: 'utf8'}));
        configfiles.normalizedAttrPerms= JSON.parse(await readFile(folder+"/normalizedAttrPerms.json", {encoding: 'utf8'}));
        configfiles.structure= JSON.parse(await readFile(folder+"/structure.json", {encoding: 'utf8'}));
        configfiles.dynchildhelpers= JSON.parse(await readFile(folder+"/dynchildhelpers.json", {encoding: 'utf8'}));

        let xmlFolderPart=folder+"/"+ constants.confAttrXmlSnippetsFolder +"/"
        let xmlConfigs=await glob(xmlFolderPart+"*.xml");
        configfiles.xmlFiles=new Map();
        for (let xmlFile of xmlConfigs){
            let xml=await readFile(xmlFile, {encoding: 'utf8'});
            let onlyFileName=xmlFile.substr(xmlFolderPart.length);
            configfiles.xmlFiles.set(onlyFileName,xml);
        }

        let structureDynamicChildrenFolderPart=folder+"/"+ constants.structureDynamicChildrenFolder +"/"
        let structureHelperStatementsFolderPart=folder+"/"+ constants.structureHelperStatementsFolder +"/"

        let structureSqlDocuments= await glob(structureDynamicChildrenFolderPart + "/*.sql");
        let helperSqlDocuments= await glob(structureHelperStatementsFolderPart + "/*.sql");

        configfiles.structureSqlFiles=new Map();
        for (let sqlFile of structureSqlDocuments){
            let sql=await readFile(sqlFile, {encoding: 'utf8'});
            let onlyFileName=sqlFile.substr(structureDynamicChildrenFolderPart.length);

            configfiles.structureSqlFiles.set(onlyFileName,sql);
        }
        configfiles.helperSqlFiles=new Map();
        for (let sqlFile of helperSqlDocuments){
            let sql=await readFile(sqlFile, {encoding: 'utf8'});
            let onlyFileName=sqlFile.substr(structureHelperStatementsFolderPart.length);

            configfiles.helperSqlFiles.set(onlyFileName,sql);
        }

        //await writeFile(folder+"/all.json", stringify(configfiles, {maxLength:80}), "utf8");

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

        //close the connection -----------------------------------------------------------------------
        await client.end()
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
      }
    }   

    



