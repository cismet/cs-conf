import util from 'util';
import { logInfo, logVerbose, logWarn } from './tools/tools';
import axios from 'axios';
import { normalize } from 'path';
import { normalizeConfig } from './normalize';

async function csVersion(options) {
    let {} = options;

    process.exit(!(await checkVersion(normalizeConfig())));
}

export async function checkVersion(config) {
    let checkUrl = config.version.checkUrl;

    try {
        let response = await axios.get(checkUrl);

        if (response.status === 200) {
            let latestJson = response.data;
            let latestVersion = latestJson.tag_name;
            let versionTag = util.format('v%s', global.version);
            if (latestVersion === versionTag) {
                logVerbose(`You are running the latest version (${versionTag}).`);
                return true;
            } else {
                logInfo(`You are currently using an outdated version (${versionTag}). A new version (${latestVersion}) is available at https://github.com/cismet/cs-conf/releases/.`);
                return false;
            }
        } else {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        logWarn("could not check the version", error);
    }
}

export async function checkVersionForCommand(command) {
    let config = global.config || normalizeConfig();
    if (command != 'version') {
        let checkForCommands = config.version.checkForCommands;
        console.log(checkForCommands);
        if (checkForCommands == "all" || checkForCommands.includes(command)) {
            await checkVersion(config);
        }
    }
}

export default csVersion;