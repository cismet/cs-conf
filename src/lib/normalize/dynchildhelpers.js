import normalizeConfigurationAttributes from "./configurationAttributes";
import { defaultDynchildhelper } from "../tools/defaultObjects";
import { util } from "chai";

function normalizeDynchildhelpers(dynchildhelpers) {
    let normalized = [];

    if (dynchildhelpers !== undefined) {
        for (let dynchildhelper of dynchildhelpers) {
            if (dynchildhelper.name == null) throw "normalizeDynchildhelpers: name missing";
            if (dynchildhelper.code == null && dynchildhelper.code_file == null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file missing", dynchildhelper.name);
            if (dynchildhelper.code != null && dynchildhelper.code_file != null) throw util.format("normalizeDynchildhelpers: [%s] either code or code_file can't be set both", dynchildhelper.name;

            normalized.push(Object.assign({}, defaultDynchildhelper, dynchildhelper));
        }
    }

    return normalized;
}

export default normalizeDynchildhelpers;