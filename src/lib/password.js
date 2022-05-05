#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import { extname } from 'path';
import util from 'util';
import { diffString } from 'json-diff';
import { getClientForConfig } from './tools/db';

import * as csDiff from './diff';

export async function worker(options) {
    let { folder, user, password, noDiffs, schema, config } = options;
    if (!noDiffs) {
        let differences = await csDiff.worker( { folder: folder, comparisionFolder: null, config: config, schema: schema } );
        if (differences > 0) {
            throw util.format("%d differences found, aborting sync !", differences);
        }
    }
}   

    



