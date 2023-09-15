import * as _ from 'lodash-transpose';
import {
    Client
} from 'pg'
import util from 'util';
import { logOut, logVerbose } from './tools';

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

export function getClientInfo() {
    let client = global.client;
    return util.format("%s@%s:%d/%s", client.user, client.host, client.port, client.database);
}

export async function initClient(connection, connect = true) {     
    if (global.client == null) {
        let jdbc = connection.jdbc;
        let user = connection.user;
        let password = connection.password;

        let con = jdbc.split("//")[1];
        let host = con.split(":")[0];
        let port = con.split(":")[1].split("/")[0];
        let database = con.split(":")[1].split("/")[1];

        global.client = new Client({
            user,
            host,
            database,
            password,
            port,
        });
    }

    if (!global.clientConnected) {
        if (connect) {
            logVerbose(util.format("Connecting to %s ...", getClientInfo()));
            await global.client.connect();
            global.clientConnected = true;
        } else {
            logOut(util.format("Connection would go to %s ...", getClientInfo()));
        }
    }
    return global.client;
}