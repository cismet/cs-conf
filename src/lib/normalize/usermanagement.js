import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultUser as defaultUser } from "./_defaultObjects";

function normalizeUsermanagement(usermanagement) {
    let normalized = [];

    if (usermanagement !== undefined) {
        for (let user of usermanagement) {
            if (user.login_name == null) throw "missing login_name";
            if (user.pw_hash == null) throw "missing pw_hash";
            if (user.salt == null) throw "missing salt";
            if (user.password != null) throw "password not allowed";

            normalized.push(Object.assign({}, defaultUser, user, {
                configurationAttributes: normalizeConfigurationAttributes(user.configurationAttributes),
            }));
        }
    }

    return normalized;
}

export default normalizeUsermanagement;