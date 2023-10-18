function exportAdditionalInfos({ csAdditionalInfos }, { config, domainConfigAttrs }) {
    let additionalInfos = {};

    for (let csAdditionalInfo of csAdditionalInfos) {
        let additionalInfo = Object.assign({}, csAdditionalInfo);
        let type = additionalInfo.type;
        let key = additionalInfo.key;
        delete additionalInfo.type;
        delete additionalInfo.key;
        
        let additionalInfosOfType = additionalInfos[type] ?? {};
        additionalInfos[type] = additionalInfosOfType;
        additionalInfosOfType[key] = additionalInfo.json;
    }
    return { additionalInfos };
}

export default exportAdditionalInfos;