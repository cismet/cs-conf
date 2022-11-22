import util from 'util';
import chalk from 'chalk';
import { getClientForConfig } from './db';

export function clean(obj) {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
    return obj;
}

export function logOut(out, options = {}) {
    let { noSilent, debugging, verbose, information, warning, error, table } = options;

    if (error) {
        out != null ? console.error(chalk.red(out)) : console.error();
    } else if (debugging) {
        if (global.debug) {
            process.stdout.write(chalk.blue("[DEBUG] "));
            table ? console.table(out) : out != null ? console.log(out) : console.log();
        }
    } else if (noSilent || !global.silent) {
        if (warning) {
            let chalkOrange = chalk.hex('#FFA500')
            process.stdout.write(chalkOrange("[WARNING] "));
            out != null ? console.log(out) : console.log();
        } else if (information) {
            out != null ? console.log(chalk.yellow(out)) : console.log();
        } else {
            if (!verbose || global.verbose) {
                table ? console.table(out) : out != null ? console.log(out) : console.log();
            }
        }
    }
}

export function logVerbose(text, options = {}) {
    logOut(text, Object.assign(options, { verbose: true }));
}

export function logErr(text, options = {}) {
    logOut(text, Object.assign(options, { error: true }));
}

export function logWarn(text, options = {}) {
    logOut(text, Object.assign(options, { warning: true }));
}

export function logInfo(text, options = {}) {
    logOut(text, Object.assign(options, { information: true }));
}

export function logDebug(text, options = {}) {
    logOut(text, Object.assign(options, { debugging: true }));
}

export async function createClient(runtimePropertiesFile, connect = true) {
    logVerbose(util.format("Loading properties %s ...", runtimePropertiesFile));
    let client = getClientForConfig(runtimePropertiesFile);

    logVerbose(util.format("Connecting to %s ...", extractDbInfo(client)));
    if (connect) {
        await client.connect();
    }
    return client;    
}

export function extractDbInfo(client) {
    return util.format("%s@%s:%d/%s", client.user, client.host, client.port, client.database);
}