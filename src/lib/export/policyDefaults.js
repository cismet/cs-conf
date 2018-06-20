import * as stmnts from './statements';

const exportPolicyDefaults = async (client) => {
    const {
        rows: policyDefaults
    } = await client.query(stmnts.policyDefaults);
    return policyDefaults;
}

export default exportPolicyDefaults;