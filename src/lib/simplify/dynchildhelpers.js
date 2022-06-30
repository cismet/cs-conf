import normalizeDynchildhelpers from "../normalize/dynchildhelpers";
import { copyFromTemplate, defaultDynchildhelper } from "../tools/defaultObjects";

function simplifyDynchildhelpers(dynchildhelpers) {
    if (dynchildhelpers == null) return null;

    let simplified = [];
    for (let dynchildhelper of normalizeDynchildhelpers(dynchildhelpers)) {
        if (dynchildhelper != null) {
            let simplifiedDynchildhelper = copyFromTemplate(dynchildhelper, defaultDynchildhelper);                
            simplified.push(simplifiedDynchildhelper);
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyDynchildhelpers;