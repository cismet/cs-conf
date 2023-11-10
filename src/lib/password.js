import cryptoRandomString from 'crypto-random-string';
import md5 from 'md5';
import util from 'util';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { logInfo, logOut } from './tools/tools';
import { readConfigFiles, writeConfigFiles } from './tools/configFiles';
import { normalizeConfig, normalizeUser } from './normalize';
import stringify from 'json-stringify-pretty-compact';
import { simplifyUser } from './simplify';
import { reorganizeUsermanagement } from './reorganize';

dayjs.extend(customParseFormat);

function createSalt(length = 16) {
    return cryptoRandomString({ length });
}

function createHash(password, salt = createSalt()) {
    return md5(util.format("%s%s", salt, password));
}

async function csPassword(options) {
    let { targetDir, loginName, password, groups, salt, time, reorganize = false, normalized = false, add = false, print: printOnly = false } = options;

    if (loginName == null && password == null) throw Error("user and password are mandatory");
    if (loginName == null) throw Error("user is mandatory");    
    if (password == null) throw Error("password is mandatory");
    if (!(add || printOnly) && normalized) throw Error("normalized can only be combined with -A|--add or -P|--print");

    if (printOnly && reorganize) throw Error("print and reorganize can't be combined");

    let timeFormat = "DD.MM.YYYY, HH:mm:ss";
    
    let newLastPwdChange = time ?? dayjs().format(timeFormat);
    if (!dayjs(newLastPwdChange, timeFormat, true).isValid()) throw Error(util.format("the time '%s' doesn't match the required format '%s'", newLastPwdChange, timeFormat));

    let newSalt = salt ?? createSalt();
    let newUser = {
        salt: newSalt,
        pw_hash: createHash(password, newSalt),
        last_pwd_change: newLastPwdChange,
        groups: groups != null ? groups.split(',') : undefined,
    };

    newUser = normalized ? normalizeUser(newUser) : simplifyUser(newUser);

    if (printOnly) {
        logOut(util.format("\"%s\": %s", loginName, stringify(newUser)), { noSilent: true });
        if (!add) {
            return;
        }
    }

    if (global.config == null) {
        global.config = normalizeConfig();
    }

    let configs = readConfigFiles(global.configsDir);
    
    if (configs == null) throw Error("config not set");

    let { usermanagement } = configs;

    if (add) {
        for (let userKey of Object.keys(usermanagement)) {
            if (userKey == loginName) throw Error(util.format('user %s already exists', loginName));
        }
        usermanagement[loginName] = newUser;
        logInfo(util.format("user '%s' added", loginName));
        logOut(stringify(normalized ? normalizeUser(newUser) : simplifyUser(newUser)), { noSilent: true });
    } else {
        let found = false;
        for (let userKey of Object.keys(usermanagement)) {
            let user = usermanagement[userKey]
            if (userKey == loginName) {
                if (found) throw Error(util.format("duplicate entry for user '%'", loginName));
                found = true;
                let newSalt = salt ?? user.salt ?? createSalt();
                let oldHash = user.pw_hash;
                let newHash = createHash(password, user.salt);
                if (groups == null && newHash == oldHash) throw Error(util.format("the new password for user %s is identical with the old password", loginName));
                let newGroups = groups != null ? groups.split(',') : user.groups;
                // this is for assuring the right order of the properties.
                // if we would directly assign the properties to the user object,
                // new properties would appear at the end of the object, and not
                // at the right position. Thats why we delete everything from user
                // and readd it in the right order
                let newInfo = {
                    salt: newSalt,
                    pw_hash: newHash,
                    last_pwd_change: newLastPwdChange,
                };
                let modifiedUser = normalizeUser(Object.assign({}, user));
                for (let key in modifiedUser) {
                    if (user[key] === undefined && newInfo === undefined) {
                        delete modifiedUser[key];
                    }
                    modifiedUser[key] = (newInfo[key] !== undefined) ? newInfo[key] : user[key]
                }
                for (let key in user) {
                    delete user[key];
                }
                for (let key in modifiedUser) {
                    user[key] = modifiedUser[key];
                }
                // ---

                logInfo(util.format("password changed for '%s'", loginName));
                logOut(stringify(normalized ? normalizeUser(user) : simplifyUser(user)), { noSilent: true });
            }
        }
        if (!found) throw Error(util.format("user '%s' not found. Use '-A|--add' to add a new user", loginName));
    }

    let preprocessed = reorganize ? Object.assign(configs, { usermanagement: reorganizeUsermanagement(configs.usermanagement)}) : configs;
    writeConfigFiles(preprocessed, targetDir);

    return configs;    
}   

export default csPassword;