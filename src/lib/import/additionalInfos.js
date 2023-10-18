function prepareAdditionalInfos({ additionalInfos }) {
    let csInfoEntries = [];
    if (additionalInfos) {
        for (let type of Object.keys(additionalInfos)) {
            if (additionalInfos[type]) {
                for (let key of Object.keys(additionalInfos[type])) {
                    csInfoEntries.push([type, key, JSON.stringify(additionalInfos[type][key])]);
                }
            }
        }
    }
    return { csInfoEntries };
}

export default prepareAdditionalInfos;