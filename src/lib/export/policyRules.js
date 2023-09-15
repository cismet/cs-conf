import * as stmnts from './statements';

async function exportPolicyRules() {
    let client = global.client;
    let {
        rows: policyRules
    } = await client.query(stmnts.policyRules);
    return { policyRules };
}

export default exportPolicyRules;