import reorganizeAttrPerms from "./reorganize/attrPerms";
import reorganizeClasses from "./reorganize/classes";
import reorganizeClassPerms from "./reorganize/classPerms";
import reorganizeDomains from "./reorganize/domains";
import reorganizeDynchildhelpers from "./reorganize/dynchildhelpers";
import reorganizePolicyRules from "./reorganize/policyRules";
import reorganizeStructure from "./reorganize/structure";
import reorganizeUsergroups from "./reorganize/usergroups";
import reorganizeUsermanagement from "./reorganize/usermanagement";
import { writeConfigFiles } from "./tools/configFiles";

async function csReorganize(options) {
    let { config, targetDir } = options;
    if (config == null) throw "config not set";

    let reorganized = reorganizeConfig(config);

    if (targetDir != null) {
        writeConfigFiles(reorganized, targetDir, true);
    }
    return reorganized;
}

export function reorganizeConfig({
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
        attrPerms: reorganizeAttrPerms(attrPerms), 
        classes: reorganizeClasses(classes), 
        classPerms: reorganizeClassPerms(classPerms), 
        domains: reorganizeDomains(domains), 
        dynchildhelpers: reorganizeDynchildhelpers(dynchildhelpers),
        helperSqlFiles, 
        policyRules: reorganizePolicyRules(policyRules), 
        structure: reorganizeStructure(structure), 
        structureSqlFiles,
        usergroups: reorganizeUsergroups(usergroups), 
        usermanagement: reorganizeUsermanagement(usermanagement), 
        xmlFiles,
    };
}

export default csReorganize;