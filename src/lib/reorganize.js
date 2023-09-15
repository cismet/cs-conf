import reorganizeConfig from "./reorganize/config";
import reorganizeAttrPerms from "./reorganize/attrPerms";
import reorganizeClasses from "./reorganize/classes";
import reorganizeClassPerms from "./reorganize/classPerms";
import reorganizeDomains from "./reorganize/domains";
import reorganizeDynchildhelpers from "./reorganize/dynchildhelpers";
import reorganizePolicyRules from "./reorganize/policyRules";
import reorganizeStructure from "./reorganize/structure";
import reorganizeUsergroups from "./reorganize/usergroups";
import reorganizeUsermanagement from "./reorganize/usermanagement";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

async function csReorganize(options) {
    let { sourceDir, targetDir } = options;
    let configsDir = sourceDir != null ? sourceDir : global.config.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";

    let reorganized = reorganizeConfigs(configs);

    targetDir = targetDir ? targetDir : global.config.configsDir;
    if (targetDir != null) {
        writeConfigFiles(reorganized, targetDir);
    }
    return reorganized;
}

export function reorganizeConfigs({
    config,
    attrPerms, 
    classes, 
    classPerms, 
    domains, 
    dynchildhelpers,
    policyRules, 
    structure, 
    usergroups, 
    usermanagement, 
    helperSqlFiles,
    structureSqlFiles,
    xmlFiles,
}) {
    return {
        config: reorganizeConfig(config), 
        attrPerms: reorganizeAttrPerms(attrPerms), 
        classes: reorganizeClasses(classes), 
        classPerms: reorganizeClassPerms(classPerms), 
        domains: reorganizeDomains(domains), 
        dynchildhelpers: reorganizeDynchildhelpers(dynchildhelpers),
        helperSqlFiles, 
        policyRules: reorganizePolicyRules(policyRules), 
        structure: reorganizeStructure(structure), 
        structureSqlFiles,
        usergroups: reorganizeUsergroups(usergroups), 
        usermanagement: reorganizeUsermanagement(usermanagement), 
        xmlFiles,
    };
}

export default csReorganize;