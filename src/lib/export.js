import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyRules from './export/policyRules';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { getClientForConfig } from './tools/db';
import { checkConfigFolders, writeConfigFiles } from './tools/configFiles';
import reorganizeAttrPerms from './reorganize/attrPerms';
import reorganizeClasses from './reorganize/classes';
import reorganizeClassPerms from './reorganize/classPerms';
import reorganizePolicyRules from './reorganize/policyRules';
import reorganizeDomains from './reorganize/domains';
import reorganizeDynchildhelpers from './reorganize/dynchildhelpers';
import reorganizeStructure from './reorganize/structure';
import reorganizeUsermanagememt from './reorganize/usermanagement';
import reorganizeUsergroups from './reorganize/usergroups';

async function createConfig(client) {
    console.log("analyzing configuration attributes");
    let {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    } = await exportConfigAttributes(client);

    console.log("analyzing domains");
    let { domains } = await exportDomains(client, domainConfigAttrs);

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

function reorganizeConfig({
    domains,
    policyRules,
    usermanagement,
    usergroups,
    classes,
    classPerms,
    attrPerms,
    structure,
    dynchildhelpers,
    structureSqlFiles,
    helperSqlFiles,
    xmlFiles
}) {
    return {
        domains: reorganizeDomains(domains),
        policyRules: reorganizePolicyRules(policyRules),
        usermanagement: reorganizeUsermanagememt(usermanagement),
        usergroups: reorganizeUsergroups(usergroups),
        classes: reorganizeClasses(classes),
        classPerms: reorganizeClassPerms(classPerms),
        attrPerms: reorganizeAttrPerms(attrPerms),
        dynchildhelpers: reorganizeDynchildhelpers(dynchildhelpers),
        structure: reorganizeStructure(structure),
        structureSqlFiles,
        helperSqlFiles,
        xmlFiles
    };
}

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

        let exported = await createConfig(client);
        Object.assign(config, reorganize ? reorganizeConfig(exported) : exported);
    } finally {
        //close the connection -----------------------------------------------------------------------
        if (!options.client && client != null) {
            await client.end();
        }
    }

    // TODO simplify

    console.log("writing config Files");
    writeConfigFiles(config, folder, overwrite);
}

export default csExport;