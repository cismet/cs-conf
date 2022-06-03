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
    let { folder, target } = options;

    let config = readConfigFiles(folder);    
    let normalized = normalizeConfig(config);
    if (target != null) {
        writeConfigFiles(normalized, target, true);
    }
    return normalized;
}

export function normalizeConfig({
    attrPerms, 
    classes, 
    classPerms, 
    domains, 
    dynchildhelpers,
    helperSqlFiles,
    policyRules, 
    structure, 
    structureSqlFiles,
    usergroups, 
    usermanagement, 
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