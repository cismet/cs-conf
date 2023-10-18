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
import simplifyAdditionalInfos from "./simplify/additionalInfo";

async function csSimplify(options) {
    let { targetDir, reorganize } = options;

    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";
    
    let simplified = simplifyConfigs(reorganize ? reorganizeConfigs(configs) : configs);

    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(simplified, targetDir);
    }
    return simplified;
}

export function simplifyConfigs(configs) {
    let mainDomain = configs.config.domainName;
    return Object.assign({}, configs, {
        config: simplifyConfig(configs.config), 
        attrPerms: simplifyAttrPerms(configs.attrPerms, configs.mainDomain), 
        classes: simplifyClasses(configs.classes), 
        classPerms: simplifyClassPerms(configs.classPerms, mainDomain), 
        domains: simplifyDomains(configs.domains, mainDomain), 
        dynchildhelpers: simplifyDynchildhelpers(configs.dynchildhelpers),
        policyRules: simplifyPolicyRules(configs.policyRules), 
        structure: simplifyStructure(configs.structure, mainDomain), 
        usergroups: simplifyUsergroups(configs.usergroups, mainDomain), 
        usermanagement: simplifyUsermanagement(configs.usermanagement, mainDomain), 
    });
}

export default csSimplify;