export function extractGroupAndDomain(key) {
    let keyComponents = key.split('@');
    let group = keyComponents[0];
    let domain = keyComponents.length == 1 ? 'LOCAL' : keyComponents[1];
    return { group, domain };
}

export function extractTableAndField(key) {
    let keyComponents = key.split('.');
    let table = keyComponents[0];
    let field = keyComponents[1];
    return { table, field } ;
}