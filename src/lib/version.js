import util from 'util';
import { logInfo, logVerbose } from './tools/tools';
import axios from 'axios';

async function csVersion(options) {
    let {} = options;

    process.exit(!(await checkVersion()));
}

export async function checkVersion() {
    let url = `https://api.github.com/repos/cismet/cs-conf/releases/latest`;

    try {
        let response = await axios.get(url);

        if (response.status === 200) {
            let latestJson = response.data;
            let latestVersion = latestJson.tag_name;
            let versionTag = util.format('v%s', global.version);
            if (latestVersion === versionTag) {
                logVerbose(`You are running the latest version (${versionTag}).`);
                return true;
            } else {
                logInfo(`You are currently using an outdated version (${versionTag}). A new version (${latestVersion}) is available at https://github.com/${owner}/${repo}/releases/.`);
                return false;
            }
        } else {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw error;
    }
}

export default csVersion;