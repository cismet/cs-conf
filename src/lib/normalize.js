import normalizeAttrPerms from "./normalize/attrPerms";
import normalizeClasses from "./normalize/classes";
import normalizeClassPerms from "./normalize/classPerms";
import normalizeDomains from "./normalize/domains";
import normalizeDynchildhelpers from "./normalize/dynchildhelpers";
import normalizePolicyRules from "./normalize/policyRules";
import normalizeStructure from "./normalize/structure";
import normalizeUsergroups from "./normalize/usergroups";
import normalizeUsermanagement from "./normalize/usermanagement";
import { writeConfigFiles } from "./tools/configFiles";

async function csNormalize(options) {
    let { config, targetDir } = options;
    if (config == null) throw "config not set";

    let normalized = normalizeConfig(config);
    
    if (targetDir != null) {
        writeConfigFiles(normalized, targetDir, true);
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
}, permissionsUpdateOnly = false) {    
    return permissionsUpdateOnly ? {
        domains: normalizeDomains(domains), 
        usergroups: normalizeUsergroups(usergroups), 
        usermanagement: normalizeUsermanagement(usermanagement), 
        xmlFiles,
    } : {
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