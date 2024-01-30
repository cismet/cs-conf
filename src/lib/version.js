import util from 'util';
import { logInfo, logVerbose } from './tools/tools';

async function csVersion(options) {
    let  { } = options;

    process.exit(!await checkVersion());
}

export async function checkVersion() {
	let owner = 'cismet';
	let repo = 'cs-conf';

	let url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
	let response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
	}

	let latestJson = await response.json();

	let latestVersion = latestJson.tag_name;

	let versionTag = util.format('v%s', global.version);
	if (latestVersion === versionTag) {
		logVerbose(`You are running the latest version (${versionTag}).`);
        return true;
	} else {
		logInfo(`You are currently using an outdated version (${versionTag}). A new version (${latestVersion}) is available at https://github.com/${owner}/${repo}/releases/.`);
        return false;
	}
}

export default csVersion;
