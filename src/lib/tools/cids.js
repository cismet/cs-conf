export function extractGroupAndDomain(key) {
    const keyComponents=key.split("@");
    const group=keyComponents[0];
    const domain=keyComponents[1];
    return { group, domain} ;
}

export function extractTableAndField(key) {
    const keyComponents=key.split(".");
    const table=keyComponents[0];
    const field=keyComponents[1];
    return { table, field} ;
}