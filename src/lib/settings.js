import fs from 'fs';
import { getSettingsDir, getSettingsJsonFile, readSettingsJsonFile, writeConfigFile } from './tools/configFiles';
import { logInfo, logOut } from './tools/tools';
import { simplifySettings } from './simplify';
import { normalizeSettings } from './normalize';
import stringify from 'json-stringify-pretty-compact';

async function csSettings(options) {
    let  { print = false, write = false, normalize = false, simplify = false } = options;

    let file = getSettingsJsonFile();

    logInfo(file);
    let raw = readSettingsJsonFile(file);

    let settings = raw;

    if (normalize) {
        settings = normalizeSettings(raw);
    } else if (simplify) {
        settings = simplifySettings(raw);
    }

    if (print) {
        logOut(stringify(settings), { noSilent: true });
    }

    if (write) {
        let settingsDir = getSettingsDir();
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir);
        }    
        writeConfigFile(settings, file);
    }
}

export default csSettings;
