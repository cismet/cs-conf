import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyRules from './export/policyRules';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { writeConfigFiles } from './tools/configFiles';
import { simplifyConfigs } from './simplify';
import { reorganizeConfigs } from './reorganize';
import { logOut, logVerbose } from './tools/tools';
import { initClient } from './tools/db';
import { getClientInfo } from './tools/db';

async function createConfig(mainDomain) {
    logVerbose(" ↳ exporting configuration attributes");
    let {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    } = await exportConfigAttributes();

    logVerbose(" ↳ exporting domains");
    let { domains } = await exportDomains(mainDomain, domainConfigAttrs);

    logVerbose(" ↳ exporting policy defaults");
    let { policyRules } = await exportPolicyRules();

    logVerbose(" ↳ exporting users and groups");
    let {
        usermanagement,
        usergroups
    } = await exportUserManagement(groupConfigAttrs, userConfigAttrs);

    logVerbose(" ↳ exporting classes and attributes");
    let {
        classes,
        attributes
    } = await exportClasses();

    logVerbose(" ↳ exporting class permissions");
    let {
        classPerms,
        classReadPerms,
        classWritePerms
    } = await exportClassPermissions(classes);
    
    logVerbose(" ↳ exporting atrributes permissions");
    let {
        attrPerms,
    } = await exportAttrPermissions(attributes, classReadPerms, classWritePerms);

    logVerbose(" ↳ exporting structure");
    let {
        structure,
        structureSqlFiles,
        dynchildhelpers,
        helperSqlFiles
    } = await exportStructure();

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
    let  { targetDir, normalized = false } = options;

    let client = await initClient(global.config.connection);

    let mainDomain = global.config.domainName;

    logOut(util.format("Exporting configuration from '%s' ...", getClientInfo()));
    let configFiles = Object.assign({ config: global.config }, await createConfig(mainDomain));

    configFiles = reorganizeConfigs(configFiles);
    if (!normalized) {
        configFiles = simplifyConfigs(configFiles);
    }

    let configsDir = targetDir != null ? targetDir : global.config.configsDir;

    writeConfigFiles(configFiles, configsDir);
}

export default csExport;