import util from 'util';
import { logInfo, logVerbose, logWarn } from './tools/tools';
import axios from 'axios';

async function csVersion(options) {
    let {} = options;

    let versionIsOk = await checkVersion();
    if (versionIsOk) {
        let infoText = util.format('You are using the latest version (v%s).', global.version);
        logInfo(infoText);
    }

    process.exit(!versionIsOk);
}

export async function checkVersion() {
    let versionSettings = global.settings.version;
    let checkUrl = versionSettings.checkUrl;

    try {
        let response = await axios.get(checkUrl);

        if (response.status === 200) {
            let latestJson = response.data;
            let latestVersion = latestJson.tag_name;
            if (!latestVersion) {
                throw Error("could not find tag name");
            }
            let versionTag = util.format('v%s', global.version);
            if (latestVersion === versionTag) {
                logVerbose(`You are running the latest version (${versionTag}).`);
                return true;
            } else {
                let releasesUrl = versionSettings.releasesUrl;
                logInfo(`You are currently using an outdated version (${versionTag}). A new version (${latestVersion}) is available at ${releasesUrl}.`);
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
    if (command != 'version') {
        let checkForCommands = global.settings.version.checkForCommands;
        if (!checkForCommands || checkForCommands.includes(command)) {
            await checkVersion();
        }
    }
}

export default csVersion;