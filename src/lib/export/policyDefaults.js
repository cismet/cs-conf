import * as stmnts from './statements';

async function exportPolicyDefaults(client, reorganize = false) {
    const {
        rows: policyDefaults
    } = await client.query(reorganize ? stmnts.policyDefaultsByKey : stmnts.policyDefaultsById);
    return policyDefaults;
}

export default exportPolicyDefaults;