import normalizeAttrPerms from "./normalize/attrPerms";
import normalizeClasses from "./normalize/classes";
import normalizeClassPerms from "./normalize/classPerms";
import normalizeDomains from "./normalize/domains";
import normalizeDynchildhelpers from "./normalize/dynchildhelpers";
import normalizePolicyRules from "./normalize/policyRules";
import normalizeStructure from "./normalize/structure";
import normalizeUsergroups from "./normalize/usergroups";
import normalizeUsermanagement from "./normalize/usermanagement";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

async function csNormalize(options) {
    let { configDir, target } = options;
    if (configDir == null) throw "configDir not set";

    let config = readConfigFiles(configDir);    
    let normalized = normalizeConfig(config);
    
    if (target != null) {
        writeConfigFiles(normalized, target, true);
    } else {
        writeConfigFiles(normalized, configDir, true);

    }
    return normalized;
}

export function normalizeConfig({
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
        attrPerms: normalizeAttrPerms(attrPerms), 
        classes: normalizeClasses(classes), 
        classPerms: normalizeClassPerms(classPerms), 
        domains: normalizeDomains(domains), 
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