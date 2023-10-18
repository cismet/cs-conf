function exportUsergroups({ csUgs }, { additionalInfos, groupConfigAttrs }) {
    let usergroups = [];
    let additionalInfosGroup = additionalInfos.group ?? {};

    for (let csUg of csUgs) {
        let groupKey = csUg.name + (csUg.domain.toUpperCase() == 'LOCAL' ? '' : '@' + csUg.domain);
        let group = {
            key: groupKey
        };
        if (csUg.descr) {
            group.descr = csUg.descr;
        }
        let attributes = groupConfigAttrs.get(csUg.name + '@' + csUg.domain);
        if (attributes) {
            group.configurationAttributes = attributes;
        }
        
        //add the additionalInfo
        group.additional_info = additionalInfosGroup[groupKey];
        delete additionalInfosGroup[groupKey];        

        usergroups.push(group);
    }

    return {
        usergroups
    }

}
export default exportUsergroups;