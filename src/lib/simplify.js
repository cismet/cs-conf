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
import { writeConfigFiles } from "./tools/configFiles";

async function csSimplify(options) {
    let { config, targetDir } = options;
    if (config == null) throw "config not set";

    let simplified = simplifyConfig(config);

    if (targetDir != null) {
        writeConfigFiles(simplified, targetDir, true);
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
    let mainDomain = null;
    if (domains != null) {
        for (let domain of domains) {
            if (domain != null && domain.main === true) {
                mainDomain = domain.domainname;
                break;
            }
        }
    }
    return {
        attrPerms: simplifyAttrPerms(attrPerms, mainDomain), 
        classes: simplifyClasses(classes), 
        classPerms: simplifyClassPerms(classPerms, mainDomain), 
        domains: simplifyDomains(domains, mainDomain), 
        dynchildhelpers: simplifyDynchildhelpers(dynchildhelpers),
        policyRules: simplifyPolicyRules(policyRules), 
        structure: simplifyStructure(structure, mainDomain), 
        usergroups: simplifyUsergroups(usergroups, mainDomain), 
        usermanagement: simplifyUsermanagement(usermanagement, mainDomain), 
        helperSqlFiles, 
        structureSqlFiles,
        xmlFiles,
    };
}

export default csSimplify;