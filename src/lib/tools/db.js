import * as _ from 'lodash-transpose';

export async function nestedFiller(client, stmnt, rows) {
    //make column arrays
    let cols = _.transpose(rows);
    return await client.query(stmnt, cols);
}


export async function singleRowFiller(client, stmnt, rows) {
    for (let row of rows) {
       await client.query(stmnt, row);
    }
}