import * as cidstools from '../tools/cids';

function createPermsEntry(groupkey, table, type, id) {
    const { group, domain } = cidstools.extractGroupAndDomain(groupkey);
    return [
        group,
        domain,
        table,
        type,
        id,
    ];
}

export default createPermsEntry;