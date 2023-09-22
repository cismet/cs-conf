function exportUsergroups({ csUgs }, { groupConfigAttrs }) {
    let usergroups = [];

    for (let csUg of csUgs) {
        let g = {
            key: csUg.name + (csUg.domain.toUpperCase() == 'LOCAL' ? '' : '@' + csUg.domain)
        };
        if (csUg.descr){
            g.descr = csUg.descr;
        }
        let attributes = groupConfigAttrs.get(csUg.name + '@' + csUg.domain);
        if (attributes) {
            g.configurationAttributes = attributes;
        }
        usergroups.push(g);
    }

    return {
        usergroups
    }

}
export default exportUsergroups;