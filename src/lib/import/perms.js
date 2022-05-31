import * as cidstools from '../tools/cids';

function createPermsEntry(groupkey, table, type) {
    const { group, domain } = cidstools.extractGroupAndDomain(groupkey);
    return [
        group,
        domain,
        table,
        type
    ];
}

export default createPermsEntry;