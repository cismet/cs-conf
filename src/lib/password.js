import cryptoRandomString from 'crypto-random-string';
import md5 from 'md5';
import util from 'util';
import { logErr, logInfo, logOut } from './tools/tools';
import { readConfigFiles, writeConfigFiles } from './tools/configFiles';
import { reorganizeConfigs } from './reorganize';
import { normalizeUser } from './normalize/usermanagement';
import reorganizeUsermanagement from './reorganize/usermanagement';

function createSalt(length = 16) {
    return cryptoRandomString({ length });
}

function createHash(password, salt = createSalt()) {
    return md5(util.format("%s%s", salt, password));
}

async function csPassword(options) {
    let { sourceDir, targetDir, loginName, password, salt, reorganize = false, normalized = false, change = false } = options;

    if (loginName == null && password == null) {
        throw "user and password are mandatory";
    }
    if (loginName == null) {
        throw "user is mandatory";
    }
    if (password == null) {
        throw "password is mandatory";
    }

    let configsDir = sourceDir != null ? sourceDir : global.config.configsDir;
    let configs = readConfigFiles(configsDir);
    
    if (configs == null) throw "config not set";

    let { usermanagement } = configs;


    let found = false;
    for (let user of usermanagement) {
        let origLoginName = user.login_name;
        if (origLoginName == loginName) {
            if (found) {
                throw util.format("duplicate entry for user '%'");
            }
            found = true;
            if (!change) {
                throw util.format("user %s already exists. Use '-C|--change' to change the password");
            } else {
                user.salt = salt != null ? salt : user.salt != null ? user.salt : createSalt();
                console.log(user.salt);
                let oldHash = user.pw_hash;
                let newHash = createHash(password, user.salt);
                if (newHash == oldHash) {
                    throw util.format("the new password for user %s is identical with the old password");
                }
                user.pw_hash = newHash;
                logInfo(util.format("password changed for '%s'", loginName));
            }
        }
    }
    if (!found) {
        if (change) {
            throw util.format("user '%s' not found. password can't be changed", loginName);
        }
        let user = {
            login_name: loginName,
            salt: salt != null ? salt : createSalt(),
            pw_hash: createHash(password, salt),
        };
        usermanagement.push(normalized ? normalizeUser(user) : user);
        logInfo(util.format("user '%s' added", loginName));
    }

    targetDir = targetDir ? targetDir : global.config.configsDir;
    if (targetDir != null) {
        writeConfigFiles(reorganize ? Object.assign(configs, { usermanagement: reorganizeUsermanagement(configs.usermanagement)}) : configs, targetDir);
    }
    return configs;    
}   

export default csPassword;