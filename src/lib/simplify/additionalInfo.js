import normalizeAdditionalInfos from "../normalize/additionalInfos";

function simplifyAdditionalInfos(additionalInfos) {
    let simplified = {};
    if (additionalInfos) {
        let normalized = normalizeAdditionalInfos(additionalInfos);
        for (let type of Object.keys(normalized)) {
            if (normalized[type]) {
                let simplifiedType = {};
                for (let key of Object.keys(normalized[type])) {
                    simplifiedType[key] = normalized[type][key];
                }
                if (Object.keys(simplifiedType).length > 0) {
                    simplified[type] = simplifiedType;
                }
            }
        }
    }
    return Object.keys(simplified).length > 0 ? simplified : undefined;
}

export default simplifyAdditionalInfos;