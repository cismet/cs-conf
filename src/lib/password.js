import cryptoRandomString from 'crypto-random-string';
import md5 from 'md5';
import util from 'util';
import { logInfo, logOut } from './tools/tools';
import { readConfigFiles, writeConfigFiles } from './tools/configFiles';
import { normalizeUser } from './normalize/usermanagement';
import reorganizeUsermanagement from './reorganize/usermanagement';
import stringify from 'json-stringify-pretty-compact';
import simplifyUsermanagement, { simplifyUser } from './simplify/usermanagement';
import normalizeConfig from './normalize/config';

function createSalt(length = 16) {
    return cryptoRandomString({ length });
}

function createHash(password, salt = createSalt()) {
    return md5(util.format("%s%s", salt, password));
}

async function csPassword(options) {
    let { sourceDir, targetDir, loginName, password, groups, salt, reorganize = false, normalized = false, add = false, print = false } = options;

    if (loginName == null && password == null) {
        throw "user and password are mandatory";
    }
    if (loginName == null) {
        throw "user is mandatory";
    }
    if (password == null) {
        throw "password is mandatory";
    }

    if (!(add || print) && normalized) {
        throw "normalized can only be combined with -A|--add or -P|--print";
    }

    if (!(add || print) && groups != null) {
        throw "groups can only be combined with -A|--add or -P|--print";
    }

    if (print && reorganize) {
        throw "print and reorganize can't be combined";
    }

    let newSalt = salt != null ? salt : createSalt();
    let newUser = {
        login_name: loginName,
        salt: newSalt,
        pw_hash: createHash(password, newSalt),
        groups: groups != null ? groups.split(',') : undefined,
    };

    newUser = normalized ? normalizeUser(newUser) : simplifyUser(newUser);

    if (print) {
        logOut(stringify(newUser), { noSilent: true });
        if (!add) {
            return;
        }
    }

    if (global.config == null) {
        global.config = normalizeConfig({ configDir: sourceDir });
    }

    let configsDir = sourceDir != null ? sourceDir : global.config.configsDir;
    let configs = readConfigFiles(configsDir);
    
    if (configs == null) throw "config not set";

    let { usermanagement } = configs;

    if (add) {
        for (let user of usermanagement) {
            let origLoginName = user.login_name;
            if (origLoginName == loginName) {
                throw util.format('user %s already exists', loginName);
            }
        }
        usermanagement.push(newUser);
        logInfo(util.format("user '%s' added", loginName));
    } else {
        let found = false;
        for (let user of usermanagement) {
            let origLoginName = user.login_name;
            if (origLoginName == loginName) {
                if (found) {
                    throw util.format("duplicate entry for user '%'", loginName);
                }
                found = true;
                user.salt = salt != null ? salt : user.salt != null ? user.salt : createSalt();
                console.log(user.salt);
                let oldHash = user.pw_hash;
                let newHash = createHash(password, user.salt);
                if (newHash == oldHash) {
                    throw util.format("the new password for user %s is identical with the old password", loginName);
                }
                user.pw_hash = newHash;                
                logInfo(util.format("password changed for '%s'", loginName));
            }
        }
        if (!found) {
            throw util.format("user '%s' not found. Use '-A|--add' to add a new user", loginName);
        }
    }

    targetDir = targetDir ? targetDir : global.config.configsDir;
    if (targetDir != null) {
        writeConfigFiles(reorganize ? Object.assign(configs, { usermanagement: reorganizeUsermanagement(configs.usermanagement)}) : configs, targetDir);
    }
    return configs;    
}   

export default csPassword;