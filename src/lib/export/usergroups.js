function exportUsergroups({ csUgs }, { groupConfigAttrs }) {
    let usergroups = [];

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
        
        usergroups.push(group);
    }

    return {
        usergroups
    }

}
export default exportUsergroups;