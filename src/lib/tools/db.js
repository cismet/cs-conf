import * as _ from 'lodash-transpose';
import propertyParser from 'properties-file';
import {
    Client
} from 'pg'
import util from 'util';
import fs from 'fs';

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

export async function getClientForConfig(config) {
    const propFileContent=fs.readFileSync(config, {encoding: 'utf8'})
    const props=propertyParser.parse(propFileContent);
    const conUrl=props["connection.url"];
    const conImportant=conUrl.split("//")[1];
    const host=conImportant.split(":")[0];
    const port=conImportant.split(":")[1].split("/")[0];
    const dbname=conImportant.split(":")[1].split("/")[1];
    const dbconfig={
        user: props["connection.username"],
        host: host,
        database: dbname,
        password: props["connection.password"],
        port: port,
    };
    //TODO make more bullet proof
    return new Client(dbconfig);
}