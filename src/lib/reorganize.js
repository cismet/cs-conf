import reorganizeConfig from "./reorganize/config";
import reorganizeAttrPerms from "./reorganize/attrPerms";
import reorganizeClasses from "./reorganize/classes";
import reorganizeClassPerms from "./reorganize/classPerms";
import reorganizeDomains from "./reorganize/domains";
import reorganizeDynchildhelpers from "./reorganize/dynchildhelpers";
import reorganizePolicyRules from "./reorganize/policyRules";
import reorganizeStructure from "./reorganize/structure";
import reorganizeUsergroups from "./reorganize/usergroups";
import reorganizeUsermanagement from "./reorganize/usermanagement";
import { readConfigFiles, writeConfigFiles } from "./tools/configFiles";
import reorganizeAdditionalInfos from "./reorganize/additionalInfos";

async function csReorganize(options) {
    let { targetDir } = options;
    let configsDir = global.configsDir;
    let configs = readConfigFiles(configsDir);
    if (configs == null) throw "config not set";

    let reorganized = reorganizeConfigs(configs);

    targetDir = targetDir ? targetDir : global.configsDir;
    if (targetDir != null) {
        writeConfigFiles(reorganized, targetDir);
    }
    return reorganized;
}

export function reorganizeConfigs(configs) {
    return Object.assign({}, configs, {
        config: reorganizeConfig(configs.config), 
        additionalInfos: reorganizeAdditionalInfos(configs.additionalInfos), 
        attrPerms: reorganizeAttrPerms(configs.attrPerms), 
        classes: reorganizeClasses(configs.classes), 
        classPerms: reorganizeClassPerms(configs.classPerms), 
        domains: reorganizeDomains(configs.domains), 
        dynchildhelpers: reorganizeDynchildhelpers(configs.dynchildhelpers),
        policyRules: reorganizePolicyRules(configs.policyRules), 
        structure: reorganizeStructure(configs.structure), 
        usergroups: reorganizeUsergroups(configs.usergroups), 
        usermanagement: reorganizeUsermanagement(configs.usermanagement), 
    });
}

export default csReorganize;