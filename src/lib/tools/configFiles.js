import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import { extname } from 'path';
import * as constants from './constants.js';

export function readConfigFile(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, {encoding: 'utf8'})) : []
}

export function readConfigFiles(folder) {
    if (!fs.existsSync(folder)) {
        throw util.format("%s does not exist", folder);
    }

    let domains = readConfigFile(util.format("%s/domains.json", folder));
    let policyRules = readConfigFile(util.format("%s/policyRules.json", folder));
    let usergroups = readConfigFile(util.format("%s/usergroups.json", folder));
    let usermanagement = readConfigFile(util.format("%s/usermanagement.json", folder));
    let classes = readConfigFile(util.format("%s/classes.json", folder));
    let classPerms = readConfigFile(util.format("%s/classPerms.json", folder));
    let attrPerms = readConfigFile(util.format("%s/attrPerms.json", folder));
    let structure = readConfigFile(util.format("%s/structure.json", folder));
    let dynchildhelpers = readConfigFile(util.format("%s/dynchildhelpers.json", folder));

    let xmlFiles = new Map();
    let confAttrXmlSnippetsFolder = util.format("%s/%s", folder, constants.confAttrXmlSnippetsFolder);
    if (fs.existsSync(confAttrXmlSnippetsFolder)) {
        for (let file of fs.readdirSync(confAttrXmlSnippetsFolder)) {
            if (extname(file) == ".xml") {
                xmlFiles.set(file, fs.readFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, file), {encoding: 'utf8'}));    
            }
        }    
    }

    let structureSqlFiles=new Map();
    let structureDynamicChildrenFolder = util.format("%s/%s", folder, constants.structureDynamicChildrenFolder);
    if (fs.existsSync(structureDynamicChildrenFolder)) {
        for (let file of fs.readdirSync(structureDynamicChildrenFolder)) {
            if (extname(file) == ".sql") {
                structureSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureDynamicChildrenFolder, file), {encoding: 'utf8'}));    
            }
        }    
    }

    let helperSqlFiles=new Map();
    let structureHelperStatementsFolder = util.format("%s/%s", folder, constants.structureHelperStatementsFolder);
    if (fs.existsSync(structureHelperStatementsFolder)) {
        for (let file of fs.readdirSync(structureHelperStatementsFolder)) {
            if (extname(file) == ".sql") {
                helperSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureHelperStatementsFolder, file), {encoding: 'utf8'}));    
            }
        }    
    }

    return {
        domains, 
        policyRules, 
        usergroups, 
        usermanagement, 
        classes, 
        classPerms, 
        attrPerms, 
        structure, 
        dynchildhelpers,
        xmlFiles,
        structureSqlFiles,
        helperSqlFiles
    }
}

export function checkConfigFolders(folder, overwrite = false) {
    if (fs.existsSync(folder) && !overwrite) {
        throw util.format("%s exists already", folder);
    }
}

export function writeConfigFiles(config, folder, overwrite = false) {
    let {
        domains,
        policyRules,
        usermanagement,
        usergroups,
        classes,
        classPerms,
        attrPerms,
        structure,
        dynchildhelpers,
        structureSqlFiles,
        helperSqlFiles,
        xmlFiles
    } = config;

    let confAttrXmlSnippetsFolder = util.format("%s/%s", folder, constants.confAttrXmlSnippetsFolder);
    let structureDynamicChildrenFolder = util.format("%s/%s", folder, constants.structureDynamicChildrenFolder);
    let structureHelperStatementsFolder = util.format("%s/%s", folder, constants.structureHelperStatementsFolder);

    // create folder structure

    if (fs.existsSync(folder) && overwrite) {
        //fs.rmSync(folder, { recursive: true, force: true }) // DANGER!!!
    }
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    if (fs.existsSync(confAttrXmlSnippetsFolder)) {
        fs.rmSync(confAttrXmlSnippetsFolder, { recursive: true, force: true });
    }
    if (xmlFiles.size > 0) {
        fs.mkdirSync(confAttrXmlSnippetsFolder);
    }

    if (fs.existsSync(structureDynamicChildrenFolder)) {
        fs.rmSync(structureDynamicChildrenFolder, { recursive: true, force: true });
    }
    if (structureSqlFiles.size > 0) {
        fs.mkdirSync(structureDynamicChildrenFolder);
    }

    if (fs.existsSync(structureHelperStatementsFolder)) {
        fs.rmSync(structureHelperStatementsFolder, { recursive: true, force: true });
    }
    if (helperSqlFiles.size > 0) {
        fs.mkdirSync(structureHelperStatementsFolder);
    }

    // writing files

    if (domains.length > 0) {
        fs.writeFileSync(util.format("%s/domains.json", folder), stringify(domains), "utf8");
    }
    if (policyRules.length > 0) {
        fs.writeFileSync(util.format("%s/policyRules.json", folder), stringify(policyRules), "utf8");
    }
    if (usergroups.length > 0) {
    fs.writeFileSync(util.format("%s/usergroups.json", folder), stringify(usergroups, { maxLength: 160 }), "utf8");
    }
    if (usermanagement.length > 0) {
        fs.writeFileSync(util.format("%s/usermanagement.json", folder), stringify(usermanagement, { maxLength: 120 }), "utf8");
    }
    if (classes.length > 0) {
        fs.writeFileSync(util.format("%s/classes.json", folder), stringify(classes, { maxLength: 100 }), "utf8");
    }
    if (classPerms.length > 0) {
        fs.writeFileSync(util.format("%s/classPerms.json", folder), stringify(classPerms, { maxLength: 100 }), "utf8");
    }
    if (attrPerms.length > 0) {
        fs.writeFileSync(util.format("%s/attrPerms.json", folder), stringify(attrPerms, { maxLength: 100 }), "utf8");
    }
    if (structure.length > 0) {
        fs.writeFileSync(util.format("%s/structure.json", folder), stringify(structure, { maxLength: 80 }), "utf8");
    }
    if (helperSqlFiles.size > 0) {
        helperSqlFiles.forEach(async (value, key) => {
            fs.writeFileSync(util.format("%s/%s", structureHelperStatementsFolder, key), value, "utf8");
        });
    }
    if (structureSqlFiles.size > 0) {
        fs.writeFileSync(util.format("%s/dynchildhelpers.json", folder), stringify(dynchildhelpers, { maxLength: 80 }), "utf8");
        structureSqlFiles.forEach(async (value, key) => {
            fs.writeFileSync(util.format("%s/%s", structureDynamicChildrenFolder, key), value, "utf8");
        });
    }        
    if (xmlFiles.size > 0) {
        xmlFiles.forEach(async (xmlToSave, fileName) => {
            fs.writeFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, fileName), xmlToSave, "utf8");
        });
    }
}
