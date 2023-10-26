import { normalizeConfigs } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let configs = readConfigFiles(global.configsDir);

    if (configs == null) throw Error("config not set");

    normalizeConfigs(configs);

    logOut("configuration ok");
}

export default csCheck;