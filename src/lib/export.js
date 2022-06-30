import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyRules from './export/policyRules';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { getClientForConfig, getDomainFromConfig } from './tools/db';
import { checkConfigFolders, writeConfigFiles } from './tools/configFiles';
import { simplifyConfig } from './simplify';
import { reorganizeConfig } from './reorganize';
import { normalizeConfig } from './normalize';

async function createConfig(client, mainDomain) {
    console.log("analyzing configuration attributes");
    let {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    } = await exportConfigAttributes(client);

    console.log("analyzing domains");
    let { domains } = await exportDomains(client, mainDomain, domainConfigAttrs);

    console.log("analyzing policy defaults");
    let { policyRules } = await exportPolicyRules(client);

    console.log("analyzing users and groups");
    let {
        usermanagement,
        usergroups
    } = await exportUserManagement(client, groupConfigAttrs, userConfigAttrs);

    console.log("analyzing classes and attributes");
    let {
        classes,
        attributes
    } = await exportClasses(client);

    console.log("analyzing class permissions");
    let {
        classPerms,
        classReadPerms,
        classWritePerms
    } = await exportClassPermissions(client, classes);
    
    console.log("analyzing atrributes permissions");
    let {
        attrPerms,
    } = await exportAttrPermissions(client, attributes, classReadPerms, classWritePerms);

    console.log("analyzing structure");
    let {
        structure,
        structureSqlFiles,
        dynchildhelpers,
        helperSqlFiles
    } = await exportStructure(client);

    return {
        domains,
        policyRules,
        usermanagement,
        usergroups,
        classes,
        classPerms,
        attrPerms,
        structure,
        structureSqlFiles,
        dynchildhelpers,
        helperSqlFiles,
        xmlFiles
    }
}

async function csExport(options) {
    let  { configDir, schema, overwrite = false, runtimePropertiesFile, simplify = false, reorganize = false } = options;

    checkConfigFolders(configDir, overwrite);

    let config = {};    
    let client;
    try {
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("loading config %s", runtimePropertiesFile));
            client = getClientForConfig(runtimePropertiesFile);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }

        let mainDomain = getDomainFromConfig(runtimePropertiesFile);

        config = await createConfig(client, mainDomain);
    } finally {
        //close the connection -----------------------------------------------------------------------
        if (!options.client && client != null) {
            await client.end();
        }
    }

    config = normalizeConfig(config);

    if (reorganize) {
        config = reorganizeConfig(config);
    }
    if (simplify) {
        config = simplifyConfig(config);
    }

    console.log("writing config Files");
    writeConfigFiles(config, configDir, overwrite);
}

export default csExport;