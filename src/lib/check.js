import { unshadowUsermanagement } from "./import";
import { inspectConfigurationAttributes, inspectDomains, inspectUsergroups, inspectUsermanagement } from "./inspect";
import { normalizeConfigs } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let configs = readConfigFiles(global.configsDir);

    if (configs == null) throw Error("config not set");

    let normalizedConfigs = normalizeConfigs(configs);
    let unshadowedUsermanagement = unshadowUsermanagement(normalizedConfigs.usermanagement);

    inspectConfigurationAttributes(normalizedConfigs, unshadowedUsermanagement);    
    inspectDomains(normalizedConfigs);
    inspectUsergroups(normalizedConfigs, unshadowedUsermanagement);
    inspectUsermanagement(normalizedConfigs, unshadowedUsermanagement);

    logOut("configuration ok");
}

export default csCheck;