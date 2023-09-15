import simplifyAttrPerms from "./simplify/attrPerms";
import simplifyClasses from "./simplify/classes";
import simplifyClassPerms from "./simplify/classPerms";
import simplifyDomains from "./simplify/domains";
import simplifyDynchildhelpers from "./simplify/dynchildhelpers";
import simplifyPolicyRules from "./simplify/policyRules";
import simplifyStructure from "./simplify/structure";
import simplifyUsergroups from "./simplify/usergroups";
import simplifyUsermanagement from "./simplify/usermanagement";
import { reorganizeConfigs } from './reorganize';
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import simplifyConfig from "./simplify/config";

async function csSimplify(options) {
    let { sourceDir, targetDir, reorganize } = options;
    let configsDir = sourceDir != null ? sourceDir : global.config.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";
    
    let simplified = simplifyConfigs(reorganize ? reorganizeConfigs(configs) : configs);

    targetDir = targetDir ? targetDir : global.config.configsDir;
    if (targetDir != null) {
        writeConfigFiles(simplified, targetDir);
    }
    return simplified;
}

export function simplifyConfigs({
    config,
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
        config: simplifyConfig(config), 
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