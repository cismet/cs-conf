import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import util from 'util';

export function prepareData(usermanagement) {
    // cs_usr
    let csUserEntries=[];
    let csUserEntriesWithPasswords=[];

    //cs_ug_membership
    let csUgMembershipEntries=[];

    for (let u of usermanagement) {
        let admin;
        if (u.administrator===true){
            admin=true;
        }
        else{
            admin=false;

        }
        if (u.password) {
            csUserEntriesWithPasswords.push([u.login_name, u.password, admin]);
        }
        else {
            csUserEntries.push([u.login_name, admin, u.pw_hash, u.salt]);
        }
        if (u.groups) {
            for (let g of u.groups) {
                const groupComponents=g.split('@');
                const gName=groupComponents[0];
                const domain=groupComponents[1];
                csUgMembershipEntries.push([gName,u.login_name,domain]);
            }
        }
    }

    return { csUserEntries, csUserEntriesWithPasswords, csUgMembershipEntries };
}

const importUsermanagement = async (client, usermanagement) => {
    const { csUserEntries, csUserEntriesWithPasswords, csUgMembershipEntries } = prepareData(usermanagement);
    console.log(util.format("importing users with pw_hashes (%d)", csUserEntries.length));
    await client.query("ALTER TABLE cs_usr DISABLE TRIGGER password_trigger;");
    await dbtools.singleRowFiller(client,stmnts.simple_cs_usr, csUserEntries);
    await client.query("ALTER TABLE cs_usr ENABLE TRIGGER password_trigger;");
    
    console.log(util.format("importing users with new passwords (%d)", csUserEntriesWithPasswords.length));
    await dbtools.singleRowFiller(client,stmnts.simple_cs_usr_with_password, csUserEntriesWithPasswords);

    console.log(util.format("importing memberships (%d)", csUgMembershipEntries.length));
    await dbtools.nestedFiller(client,stmnts.nested_cs_ug_membership, csUgMembershipEntries);
}

export default importUsermanagement;