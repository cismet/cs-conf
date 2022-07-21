import cryptoRandomString from 'crypto-random-string';
import md5 from 'md5';
import util from 'util';
import { logOut } from './tools/tools';

async function csPassword(options) {
    let { loginName, password, salt = cryptoRandomString({ length: 16 }) } = options;
    if (loginName == null && password == null) {
        throw "user and password are mandatory";
    }
    if (loginName == null) {
        throw "user is mandatory";
    }
    if (password == null) {
        throw "password is mandatory";
    }
    let hash = md5(util.format("%s%s", salt, password));
    let user = {
        login_name: loginName,
        pw_hash: hash,
        salt
    }

    logOut(JSON.stringify(user, null, 2));
}   

export default csPassword;