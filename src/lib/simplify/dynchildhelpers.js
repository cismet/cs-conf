import { copyFromTemplate, defaultDynchildhelper } from "../tools/defaultObjects";

function simplifyDynchildhelpers(dynchildhelpers) {
    if (dynchildhelpers == null) return null;

    let simplified = [];
    if (dynchildhelpers != null) {
        for (let dynchildhelper of dynchildhelpers) {
            if (dynchildhelper != null) {
                let simplifiedDynchildhelper = copyFromTemplate(dynchildhelper, defaultDynchildhelper);                
                simplified.push(simplifiedDynchildhelper);
            }
        }
    }
    return simplified;
}

export default simplifyDynchildhelpers;