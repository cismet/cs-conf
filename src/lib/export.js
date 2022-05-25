import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyDefaults from './export/policyDefaults';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { getClientForConfig } from './tools/db';
import { checkConfigFolders, writeConfigFiles } from './tools/configFiles';

async function csExport(options) {
    let  { folder, schema, overwrite = false, configDir, reorganize = false } = options;

    checkConfigFolders(folder, overwrite);

    let config = {};    
    let client;
    try {
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("loading config %s", configDir));
            client = getClientForConfig(configDir);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }

        console.log("analyzing configuration attributes");
        let {
            userConfigAttrs,
            groupConfigAttrs,
            domainConfigAttrs,
            xmlFiles
        } = await exportConfigAttributes(client, folder, schema);

        console.log("analyzing domains");
        let domains = await exportDomains(client, domainConfigAttrs, reorganize);

        console.log("analyzing policy defaults");
        let policyRules = await exportPolicyDefaults(client, reorganize);

        console.log("analyzing users and groups");
        let {
            usermanagement,
            usergroups
        } = await exportUserManagement(client, groupConfigAttrs, userConfigAttrs, reorganize);

        console.log("analyzing classes and attributes");
        let {
            classes,
            attributes
        } = await exportClasses(client, reorganize);

        console.log("analyzing class permissions");
        let {
            classPerms,
            //normalizedClassPerms,
            classReadPerms,
            classWritePerms
        } = await exportClassPermissions(client, classes, reorganize);

        console.log("analyzing atrributes permissions");
        let {
            attrPerms,
            //normalizedAttrPerms
        } = await exportAttrPermissions(client, attributes, classReadPerms, classWritePerms, reorganize);

        console.log("analyzing structure");
        let {
            structure,
            structureSqlDocuments,
            dynchildhelpers,
            helperSqlDocuments
        } = await exportStructure(client);

        Object.assign(config, {
            domains,
            policyRules,
            usermanagement,
            usergroups,
            classes,
            classPerms,
            //normalizedClassPerms,
            attrPerms,
            //normalizedAttrPerms,
            structure,
            structureSqlDocuments,
            dynchildhelpers,
            helperSqlDocuments,
            xmlFiles
        });
    } finally {
        //close the connection -----------------------------------------------------------------------
        if (!options.client) {
            await client.end();
        }
    }

    // TODO simplify

    console.log("writing config Files");
    writeConfigFiles(folder, config, overwrite);
}

export default csExport;