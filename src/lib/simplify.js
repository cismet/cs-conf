import { normalizeConfig } from "./normalize";
import simplifyAttrPerms from "./simplify/attrPerms";
import simplifyClasses from "./simplify/classes";
import simplifyClassPerms from "./simplify/classPerms";
import simplifyDomains from "./simplify/domains";
import simplifyDynchildhelpers from "./simplify/dynchildhelpers";
import simplifyPolicyRules from "./simplify/policyRules";
import simplifyStructure from "./simplify/structure";
import simplifyUsergroups from "./simplify/usergroups";
import simplifyUsermanagement from "./simplify/usermanagement";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";

async function csSimplify(options) {
    let { configDir, target } = options;
    if (configDir == null) throw "configDir not set";

    let config = readConfigFiles(configDir);    
    let simplified = simplifyConfig(config);

    if (target != null) {
        writeConfigFiles(simplified, target, true);
    } else {
        writeConfigFiles(simplified, configDir, true);
    }
    return simplified;
}

export function simplifyConfig({
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
        attrPerms: simplifyAttrPerms(attrPerms), 
        classes: simplifyClasses(classes), 
        classPerms: simplifyClassPerms(classPerms), 
        domains: simplifyDomains(domains), 
        dynchildhelpers: simplifyDynchildhelpers(dynchildhelpers),
        helperSqlFiles, 
        policyRules: simplifyPolicyRules(policyRules), 
        structure: simplifyStructure(structure), 
        structureSqlFiles,
        usergroups: simplifyUsergroups(usergroups), 
        usermanagement: simplifyUsermanagement(usermanagement), 
        xmlFiles,
    };
}

export default csSimplify;