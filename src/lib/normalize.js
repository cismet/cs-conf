import normalizeAttrPerms from "./normalize/attrPerms";
import normalizeClasses from "./normalize/classes";
import normalizeClassPerms from "./normalize/classPerms";
import normalizeConfig from "./normalize/config";
import normalizeDomains from "./normalize/domains";
import normalizeDynchildhelpers from "./normalize/dynchildhelpers";
import normalizePolicyRules from "./normalize/policyRules";
import normalizeStructure from "./normalize/structure";
import normalizeUsergroups from "./normalize/usergroups";
import normalizeUsermanagement from "./normalize/usermanagement";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

async function csNormalize(options) {
    let { targetDir } = options;
    let configs = readConfigFiles(global.configsDir);
    if (configs == null) throw "config not set";

    let normalized = normalizeConfigs(configs);
    
    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(normalized, targetDir);
    }
    return normalized;
}

export function normalizeConfigs({
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
        config: normalizeConfig(config),
        attrPerms: normalizeAttrPerms(attrPerms), 
        classes: normalizeClasses(classes), 
        classPerms: normalizeClassPerms(classPerms), 
        domains: normalizeDomains(domains, config.domainName), 
        dynchildhelpers: normalizeDynchildhelpers(dynchildhelpers),
        helperSqlFiles,
        policyRules: normalizePolicyRules(policyRules), 
        structure: normalizeStructure(structure), 
        structureSqlFiles,
        usergroups: normalizeUsergroups(usergroups), 
        usermanagement: normalizeUsermanagement(usermanagement), 
        xmlFiles,
    };
}

export default csNormalize;