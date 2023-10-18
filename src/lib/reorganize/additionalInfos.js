
function reorganizeAdditionalInfos(additionalInfos) {

    if (additionalInfos != null) {
        let sortedAdditionalInfos = {};    
        for (let type of Object.keys(additionalInfos).sort()) {
            let additionalInfo = additionalInfos[type];
            if (additionalInfo != null) {
                let sortedAdditionalInfo = {};
                for (let key of Object.keys(additionalInfo).sort()) {
                    sortedAdditionalInfo[key] = additionalInfo[key];
                }
                sortedAdditionalInfos[type] = sortedAdditionalInfo;                
            }
        }

        return sortedAdditionalInfos;
    }        
    return additionalInfos;
}

export default reorganizeAdditionalInfos;