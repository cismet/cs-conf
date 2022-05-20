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

export async function worker(options) {
    let  { folder, schema, config } = options;
    let client;
    if (options.client) {
        client = options.client;
    } else {
        console.log(util.format("loading config %s", config));
        client = await getClientForConfig(config);

        console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
        await client.connect();
    }

    // Folder Check
    if (fs.existsSync(folder)) {
        throw util.format("%s exists already", folder);
        // TODO: -O for overwrite 
        //fs.rmSync(folder, { recursive: true, force: true });
    }
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    let confAttrXmlSnippetsFolder = util.format("%s/%s", folder, constants.confAttrXmlSnippetsFolder);
    if (fs.existsSync(confAttrXmlSnippetsFolder)){
        fs.rmSync(confAttrXmlSnippetsFolder, { recursive: true, force: true });
    }
    if (!fs.existsSync(confAttrXmlSnippetsFolder)){
        fs.mkdirSync(confAttrXmlSnippetsFolder);
    }

    let structureDynamicChildrenFolder = util.format("%s/%s", folder, constants.structureDynamicChildrenFolder);
    if (fs.existsSync(structureDynamicChildrenFolder)){
        fs.rmSync(structureDynamicChildrenFolder, { recursive: true, force: true });
    }
    if (!fs.existsSync(structureDynamicChildrenFolder)){
        fs.mkdirSync(structureDynamicChildrenFolder);
    }

    let structureHelperStatementsFolder = util.format("%s/%s", folder, constants.structureHelperStatementsFolder);
    if (fs.existsSync(structureHelperStatementsFolder)){
        fs.rmSync(structureHelperStatementsFolder, { recursive: true, force: true });
    }
    if (!fs.existsSync(structureHelperStatementsFolder)){
        fs.mkdirSync(structureHelperStatementsFolder);
    }

    //ConfigAttr -----------------------------------------------------------------------
    console.log("analyzing configuration attributes");
    const {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    } = await exportConfigAttributes(client, folder, schema);

    //Write XML Files -----------------------------------------------------------------------
    xmlFiles.forEach(async (xmlToSave, fileName) => {
        fs.writeFileSync(util.format("%s/%s/%s", folder, constants.confAttrXmlSnippetsFolder, fileName), xmlToSave, "utf8");
    });

    //Domains -----------------------------------------------------------------------
    console.log("writing domains.json");
    const domainArray = await exportDomains(client, domainConfigAttrs);
    fs.writeFileSync(util.format("%s/domains.json", folder), stringify(domainArray), "utf8");


    // Policy defaults -----------------------------------------------------------------------
    console.log("writing policy_rules.json");
    const policyDefaults = await exportPolicyDefaults(client);
    fs.writeFileSync(util.format("%s/policy_rules.json", folder), stringify(policyDefaults), "utf8");

    // Usermanegement -----------------------------------------------------------------------
    console.log("writing usergroups.json");
    const {
        userArray,
        groups
    } = await exportUserManagement(client, groupConfigAttrs, userConfigAttrs);
    fs.writeFileSync(util.format("%s/usergroups.json", folder), stringify(groups, { maxLength: 160 }), "utf8");

    console.log("writing usermanagement.json");
    fs.writeFileSync(util.format("%s/usermanagement.json", folder), stringify(userArray, { maxLength: 120 }), "utf8");

    // classes and attributes -----------------------------------------------------------------------
    console.log("writing classes.json");
    const {
        cidsClasses,
        attributes
    } = await exportClasses(client);
    fs.writeFileSync(util.format("%s/classes.json", folder), stringify(cidsClasses, { maxLength: 100 }), "utf8");

    //class permissions -----------------------------------------------------------------------
    console.log("writing classPerms.json");
    const {
        cPermByTable,
        normalizedClassPermResult,
        classReadPerms,
        classWritePerms
    } = await exportClassPermissions(client, cidsClasses);
    fs.writeFileSync(util.format("%s/classPerms.json", folder), stringify(cPermByTable, { maxLength: 100 }), "utf8");

    console.log("writing normalized classPerms.json");
    fs.writeFileSync(util.format("%s/normalizedClassPerms.json", folder), stringify(normalizedClassPermResult, { maxLength: 100 }), "utf8");

    //attr permissions -----------------------------------------------------------------------
    console.log("writing attrPerms.json");
    const {
        aPermByTable,
        normalizedAttrPermResult
    } = await exportAttrPermissions(client, attributes, classReadPerms, classWritePerms);
    fs.writeFileSync(util.format("%s/attrPerms.json", folder), stringify(aPermByTable, { maxLength: 100 }), "utf8");
    console.log("writing normalized attrPerms.json");
    fs.writeFileSync(util.format("%s/normalizedAttrPerms.json", folder), stringify(normalizedAttrPermResult, { maxLength: 100 }), "utf8");

    //structure -----------------------------------------------------------------------
    console.log("writing structure.json");
    const {
        rootNodes,
        structureSqlDocuments,
        dynchildhelpers,
        helperSqlDocuments
    } = await exportStructure(client);
    fs.writeFileSync(util.format("%s/structure.json", folder), stringify(rootNodes, { maxLength: 80 }), "utf8");
    fs.writeFileSync(util.format("%s/dynchildhelpers.json", folder), stringify(dynchildhelpers, { maxLength: 80 }), "utf8");

    console.log("writing sql snippets");
    structureSqlDocuments.forEach(async (value, key) => {
        fs.writeFileSync(util.format("%s/%s/%s", folder, constants.structureDynamicChildrenFolder, key), value, "utf8");
    });
    helperSqlDocuments.forEach(async (value, key) => {
        fs.writeFileSync(util.format("%s/%s/%s", folder, constants.structureHelperStatementsFolder, key), value, "utf8");
    });

    //close the connection -----------------------------------------------------------------------
    if (!options.client) {
        await client.end();
    }
}
