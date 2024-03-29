import util from 'util';
import fs from 'fs';
import propertyParser from 'properties-file';

import { getFormatVersion, readConfigFile, writeConfigFile } from './tools/configFiles';
import { logVerbose } from './tools/tools';
import { simplifyConfig } from './simplify';
import { normalizeConfig } from './normalize';

function getConfigFromRuntimeProperties(runtimeProperties) {
    logVerbose(util.format("Loading properties %s ...", runtimeProperties));
    let propFileContent = fs.readFileSync(runtimeProperties, {encoding: 'utf8'});

    let formatVersion = getFormatVersion();
    let properties = propertyParser.parse(propFileContent);
    let config = {
        formatVersion,
        connection: {
            jdbc: properties['connection.url'],
            user: properties['connection.username'],
            password: properties['connection.password'],
        },
        domainName: properties["serverName"],
        policies: {
            server: properties['serverPolicy'],
            attributes: properties['attributePolicy'],
            classNodes: properties['classNodePolicy'],
            pureNodes: properties['pureNodePolicy'],
        }
    };
    return config;
}

async function csConfig(options) {
    let  { file, runtimeProperties, normalize = false } = options;

    let config = {};
    if (fs.existsSync(file)) {
        Object.assign(config, readConfigFile(file));
    }

    if (runtimeProperties != null) {
        if (!fs.existsSync(runtimeProperties)) {
            throw Error(util.format("the properties file '%s' does not exists", runtimeProperties));
        }

        config = Object.assign(config, getConfigFromRuntimeProperties(runtimeProperties));
    }


    global.config = normalizeConfig();
    if (normalize) {
        config = normalizeConfig(config);
    } else {
        config = simplifyConfig(config);
    }

    writeConfigFile(config, file);
}

export default csConfig;
