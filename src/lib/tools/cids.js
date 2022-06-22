import util from "util";

export function extendLocalDomain(key) {
    let parts = key.split('@');     
    let group = parts[0];
    let domain = parts.length == 1 ? 'LOCAL' : parts[1];
    return util.format("%s@%s", group, domain);

}

export function removeLocalDomain(key) {
    if (key != null && key.endsWith("@LOCAL")) {
        return key.substring(0, key.length - "@LOCAL".length);
    } else {
        return key;
    }
}

export function extractGroupAndDomain(key) {
    if (key != null) {
        let keyComponents = key.split('@');
        return { group: keyComponents[0], domain: keyComponents[1] };
    } else {
        return null;
    }
}

export function extractTableAndField(key) {
    if (key != null) {
        let keyComponents = key.split('.');
        return { table: keyComponents[0], field: keyComponents[1] } ;
    } else {
        return null;
    }
}