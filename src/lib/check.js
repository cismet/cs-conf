import { normalizeConfig } from "./normalize";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let { config } = options;
    if (config == null) throw "config not set";

    normalizeConfig(config);

    logOut("configuration ok");
}

export default csCheck;