import normalizeAdditionalInfos from "./normalize/additionalInfos";
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

export function normalizeConfigs(configs) {    
    return Object.assign({}, configs, {
        config: normalizeConfig(configs.config),
        attrPerms: normalizeAttrPerms(configs.attrPerms), 
        classes: normalizeClasses(configs.classes), 
        classPerms: normalizeClassPerms(configs.classPerms), 
        domains: normalizeDomains(configs.domains, configs.config.domainName), 
        dynchildhelpers: normalizeDynchildhelpers(configs.dynchildhelpers),
        policyRules: normalizePolicyRules(configs.policyRules), 
        structure: normalizeStructure(configs.structure), 
        usergroups: normalizeUsergroups(configs.usergroups), 
        usermanagement: normalizeUsermanagement(configs.usermanagement), 
    });
}

export default csNormalize;