import * as _ from 'lodash-transpose';
import util from 'util';

export async function nestedFiller(client, stmnt, rows) {
    //make column arrays
    if (rows && rows.length > 0)  {
        let cols = _.transpose(rows);
        return await client.query(stmnt, cols);
    } else {
        return { rows: [] };
    }
}

export async function singleRowFiller(client, stmnt, rows) {
    for (let row of rows) {
        await client.query(stmnt, row);
    }
}

export function extractDbInfo(client) {
    return util.format("%s@%s:%d/%s", client.user, client.host, client.port, client.database);
}