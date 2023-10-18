import { defaultAdditionalInfos } from "../tools/defaultObjects";

function normalizeAdditionalInfos(additionalInfos) {
    let normalized = {};
    
    if (additionalInfos) {
        Object.assign(normalized, defaultAdditionalInfos, additionalInfos);
    }
    
    return normalized;
}

export default normalizeAdditionalInfos;