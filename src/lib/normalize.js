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

    let {
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
    } = readConfigFiles(folder);

    
    let normalized = {
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
    }

    if (target != null) {
        writeConfigFiles(target, normalized, true);
    }
    return normalized;
}

export default csNormalize;