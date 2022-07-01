import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyRules from './export/policyRules';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { getDomainFromConfig } from './tools/db';
import { checkConfigFolders, writeConfigFiles } from './tools/configFiles';
import { simplifyConfig } from './simplify';
import { reorganizeConfig } from './reorganize';
import { normalizeConfig } from './normalize';
import { createClient, extractDbInfo, logOut, logVerbose } from './tools/tools';

async function createConfig(client, mainDomain) {
    logVerbose(" ↳ exporting configuration attributes");
    let {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    } = await exportConfigAttributes(client);

    logVerbose(" ↳ exporting domains");
    let { domains } = await exportDomains(client, mainDomain, domainConfigAttrs);

    logVerbose(" ↳ exporting policy defaults");
    let { policyRules } = await exportPolicyRules(client);

    logVerbose(" ↳ exporting users and groups");
    let {
        usermanagement,
        usergroups
    } = await exportUserManagement(client, groupConfigAttrs, userConfigAttrs);

    logVerbose(" ↳ exporting classes and attributes");
    let {
        classes,
        attributes
    } = await exportClasses(client);

    logVerbose(" ↳ exporting class permissions");
    let {
        classPerms,
        classReadPerms,
        classWritePerms
    } = await exportClassPermissions(client, classes);
    
    logVerbose(" ↳ exporting atrributes permissions");
    let {
        attrPerms,
    } = await exportAttrPermissions(client, attributes, classReadPerms, classWritePerms);

    logVerbose(" ↳ exporting structure");
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
    let mainDomain = getDomainFromConfig(runtimePropertiesFile);

    let config = {};    
    let client;
    try {
        client = (options.client != null) ? options.client : await createClient(runtimePropertiesFile);
        logOut(util.format("Exporting configuration from '%s' ...", extractDbInfo(client)));
        config = await createConfig(client, mainDomain);
    } finally {
        if (options.client == null && client != null) {
            await client.end();
        }
    }

    config = normalizeConfig(config);
    if (simplify) {
        config = simplifyConfig(config);
    }
    if (reorganize) {
        config = reorganizeConfig(config);
    }

    logOut(util.format(" ↳ writing configuration to %s", configDir));
    writeConfigFiles(config, configDir, overwrite);
}

export default csExport;