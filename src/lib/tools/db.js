import * as _ from 'lodash-transpose';
import propertyParser from 'properties-file';
import {
    Client
} from 'pg'
import fs from 'fs';

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

function getPropsFromConfig(config) {
    let propFileContent = fs.readFileSync(config, {encoding: 'utf8'});
    return propertyParser.parse(propFileContent);
}

export function getClientForConfig(config) {
    let props = getPropsFromConfig(config);
    let conUrl = props["connection.url"];
    let conImportant = conUrl.split("//")[1];
    let host = conImportant.split(":")[0];
    let port = conImportant.split(":")[1].split("/")[0];
    let dbname = conImportant.split(":")[1].split("/")[1];
    let dbconfig = {
        user: props["connection.username"],
        host: host,
        database: dbname,
        password: props["connection.password"],
        port: port,
    };
    //TODO make more bullet proof
    return new Client(dbconfig);
}

export function getDomainFromConfig(config) {
    let props = getPropsFromConfig(config);
    return props["serverName"];
}

export function setIdsFromOrder(rows) {
    let index = 0;    
    for(let row of rows) {
        row.push(++index);
    }
}