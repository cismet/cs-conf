#!/usr/bin/env ./node_modules/.bin/babel-node

import stringify from 'json-stringify-pretty-compact';
import fs from 'fs';
import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyDefaults from './export/policyDefaults';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import * as constants from './tools/constants.js';
import { getClientForConfig } from './tools/db';

const writeFile = util.promisify(fs.writeFile);
export async function worker(folder, schema, config) {
    try {

        const client = await getClientForConfig(config);
        await client.connect();
        console.log("...");

        // Folder Check
        if (!fs.existsSync(folder)){
            fs.mkdirSync(folder);
        }
        if (!fs.existsSync(folder + "/"+ constants.confAttrXmlSnippetsFolder)){
            fs.mkdirSync(folder + "/"+ constants.confAttrXmlSnippetsFolder);
        }
        if (!fs.existsSync(folder + "/"+ constants.structureDynamicChildrenFolder)){
            fs.mkdirSync(folder + "/"+ constants.structureDynamicChildrenFolder);
        }
        if (!fs.existsSync(folder + "/"+ constants.structureHelperStatementsFolder)){
            fs.mkdirSync(folder + "/"+ constants.structureHelperStatementsFolder);
        }


        //ConfigAttr -----------------------------------------------------------------------
        const {
            userConfigAttrs,
            groupConfigAttrs,
            domainConfigAttrs,
            xmlFiles
        } = await exportConfigAttributes(client, folder, schema);

        //Write XML Files -----------------------------------------------------------------------
        xmlFiles.forEach(async (xmlToSave, fileName) => {
            await writeFile(folder + "/"+ constants.confAttrXmlSnippetsFolder +"/" + fileName, xmlToSave, "utf8");
        });

        //Domains -----------------------------------------------------------------------
        const domainArray = await exportDomains(client, domainConfigAttrs);
        console.log("writing domains.json");
        await writeFile(folder + "/domains.json", stringify(domainArray), "utf8");


        // Policy defaults -----------------------------------------------------------------------
        const policyDefaults = await exportPolicyDefaults(client);
        console.log("writing policy_rules.json");
        await writeFile(folder + "/policy_rules.json", stringify(policyDefaults), "utf8");

        // Usermanegement -----------------------------------------------------------------------
        const {
            userArray,
            groups
        } = await exportUserManagement(client, groupConfigAttrs, userConfigAttrs);
        console.log("writing usergroups.json");
        await writeFile(folder + "/usergroups.json", stringify(groups, {
            maxLength: 160
        }), "utf8");

        console.log("writing usermanagement.json");
        await writeFile(folder + "/usermanagement.json", stringify(userArray, {
            maxLength: 120
        }), "utf8");

        // classes and attributes -----------------------------------------------------------------------
        const {
            cidsClasses,
            attributes
        } = await exportClasses(client);
        console.log("writing classes.json");
        await writeFile(folder + "/classes.json", stringify(cidsClasses, {
            maxLength: 100
        }), "utf8");

        //class permissions -----------------------------------------------------------------------
        const {
            cPermByTable,
            normalizedClassPermResult,
            classReadPerms,
            classWritePerms
        } = await exportClassPermissions(client, cidsClasses);
        console.log("writing classPerms.json");
        await writeFile(folder + "/classPerms.json", stringify(cPermByTable, {
            maxLength: 100
        }), "utf8");

        console.log("writing normalized classPerms.json");
        await writeFile(folder + "/normalizedClassPerms.json", stringify(normalizedClassPermResult, {
            maxLength: 100
        }), "utf8");

        //attr permissions -----------------------------------------------------------------------
        const {
            aPermByTable,
            normalizedAttrPermResult
        } = await exportAttrPermissions(client, attributes, classReadPerms, classWritePerms);
        console.log("writing attrPerms.json");
        await writeFile(folder + "/attrPerms.json", stringify(aPermByTable, {
            maxLength: 100
        }), "utf8");
        console.log("writing normalized attrPerms.json");
        await writeFile(folder + "/normalizedAttrPerms.json", stringify(normalizedAttrPermResult, {
            maxLength: 100
        }), "utf8");

        //structure -----------------------------------------------------------------------
        const {
            rootNodes,
            structureSqlDocuments,
            dynchildhelpers,
            helperSqlDocuments
        } = await exportStructure(client);

        console.log("writing structure.json");
        //console.log(nodes);
        //await writeFile(folder+"/structure.json", JSON.stringify(rootNodes, null,2), "utf8");
        await writeFile(folder + "/structure.json", stringify(rootNodes, {
            maxLength: 80
        }), "utf8");
        await writeFile(folder + "/dynchildhelpers.json", stringify(dynchildhelpers, {
            maxLength: 80
        }), "utf8");


        console.log("writing sql snippets");
        structureSqlDocuments.forEach(async (value, key) => {
            await writeFile(folder + "/"+ constants.structureDynamicChildrenFolder +"/" + key, value, "utf8");
        });

        helperSqlDocuments.forEach(async (value, key) => {
            await writeFile(folder + "/"+ constants.structureHelperStatementsFolder +"/" + key, value, "utf8");
        });

        //close the connection -----------------------------------------------------------------------

        await client.end()
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}
