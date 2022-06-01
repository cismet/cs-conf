import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDynchildhelper } from "./_defaultObjects";

function normalizeDynchildhelpers(dynchildhelpers) {
    let normalized = [];

    if (dynchildhelpers !== undefined) {
        for (let dynchildhelper of dynchildhelpers) {
            if (dynchildhelper.name == null) throw "name missing";
            if (dynchildhelper.code == null && dynchildhelper.code_file == null) throw "either code or code_file missing";
            if (dynchildhelper.code != null && dynchildhelper.code_file != null) throw "either code or code_file can't be set both";

            normalized.push(Object.assign({}, defaultDynchildhelper, dynchildhelper));
        }
    }

    return normalized;
}

export default normalizeDynchildhelpers;