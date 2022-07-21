import * as stmnts from './statements';

async function exportPolicyRules(client) {
    const {
        rows: policyRules
    } = await client.query(stmnts.policyRules);
    return { policyRules };
}

export default exportPolicyRules;