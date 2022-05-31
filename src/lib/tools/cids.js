import util from "util";

export function extractGroupAndDomain(key) {
    if (key != null) {
        let keyComponents = key.split('@');
        let group = keyComponents[0];
        let domain = keyComponents.length == 1 ? 'LOCAL' : keyComponents[1];
        return { group, domain };
    } else {
        return null;
    }
}

export function extendLocalDomain(key) {
    let parts = key.split('@');     
    let group = parts[0];
    let domain = parts.length == 1 ? 'LOCAL' : parts[1];
    return util.format("%s@%s", group, domain);

}

export function extractTableAndField(key) {
    if (key != null) {
        let keyComponents = key.split('.');
        let table = keyComponents[0];
        let field = keyComponents[1];
        return { table, field } ;
    } else {
        return null;
    }
}