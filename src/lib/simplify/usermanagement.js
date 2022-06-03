import normalizeUsermanagement from "../normalize/usermanagement";
import { copyFromTemplate, defaultUser } from "../tools/defaultObjects";
import simplifyConfigurationAttributes from "./configurationAttributes";

function simplifyUsermanagement(usermanagement) {
    if (usermanagement == null) return null;

    let simplified = [];
    for (let user of normalizeUsermanagement(usermanagement)) {
        if (user != null) {
            let simplifiedUser = copyFromTemplate(user, defaultUser);
            if (user.configurationAttributes !== undefined) {
                simplifiedUser.configurationAttributes = simplifyConfigurationAttributes(user.configurationAttributes);
            }
            simplified.push(simplifiedUser);
        }
    }
    return simplified;
}

export default simplifyUsermanagement;