import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import { extname } from 'path';
import * as constants from './constants.js';

export function readConfigFile(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, {encoding: 'utf8'})) : []
}

export function readConfigFiles(configDir) {
    if (!fs.existsSync(configDir)) {
        throw util.format("%s does not exist", configDir);
    }

    let domains = readConfigFile(util.format("%s/domains.json", configDir));
    let policyRules = readConfigFile(util.format("%s/policyRules.json", configDir));
    let usergroups = readConfigFile(util.format("%s/usergroups.json", configDir));
    let usermanagement = readConfigFile(util.format("%s/usermanagement.json", configDir));
    let classes = readConfigFile(util.format("%s/classes.json", configDir));
    let classPerms = readConfigFile(util.format("%s/classPerms.json", configDir));
    let attrPerms = readConfigFile(util.format("%s/attrPerms.json", configDir));
    let structure = readConfigFile(util.format("%s/structure.json", configDir));
    let dynchildhelpers = readConfigFile(util.format("%s/dynchildhelpers.json", configDir));

    let xmlFiles = new Map();
    let confAttrXmlSnippetsFolder = util.format("%s/%s", configDir, constants.confAttrXmlSnippetsFolder);
    if (fs.existsSync(confAttrXmlSnippetsFolder)) {
        for (let file of fs.readdirSync(confAttrXmlSnippetsFolder)) {
            if (extname(file) == ".xml") {
                xmlFiles.set(file, fs.readFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, file), {encoding: 'utf8'}));    
            }
        }    
    }

    let structureSqlFiles=new Map();
    let structureDynamicChildrenFolder = util.format("%s/%s", configDir, constants.structureDynamicChildrenFolder);
    if (fs.existsSync(structureDynamicChildrenFolder)) {
        for (let file of fs.readdirSync(structureDynamicChildrenFolder)) {
            if (extname(file) == ".sql") {
                structureSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureDynamicChildrenFolder, file), {encoding: 'utf8'}));    
            }
        }    
    }

    let helperSqlFiles=new Map();
    let structureHelperStatementsFolder = util.format("%s/%s", configDir, constants.structureHelperStatementsFolder);
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

export function checkConfigFolders(configDir, overwrite = false) {
    if (fs.existsSync(configDir) && !overwrite) {
        throw util.format("%s exists already", configDir);
    }
}

export function writeConfigFiles(config, configDir, overwrite = false) {
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

    let confAttrXmlSnippetsFolder = util.format("%s/%s", configDir, constants.confAttrXmlSnippetsFolder);
    let structureDynamicChildrenFolder = util.format("%s/%s", configDir, constants.structureDynamicChildrenFolder);
    let structureHelperStatementsFolder = util.format("%s/%s", configDir, constants.structureHelperStatementsFolder);

    // create configDir structure

    if (fs.existsSync(configDir) && overwrite) {
        //fs.rmSync(configDir, { recursive: true, force: true }) // DANGER!!!
    }
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
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
        fs.writeFileSync(util.format("%s/domains.json", configDir), stringify(domains), "utf8");
    }
    if (policyRules.length > 0) {
        fs.writeFileSync(util.format("%s/policyRules.json", configDir), stringify(policyRules), "utf8");
    }
    if (usergroups.length > 0) {
    fs.writeFileSync(util.format("%s/usergroups.json", configDir), stringify(usergroups, { maxLength: 160 }), "utf8");
    }
    if (usermanagement.length > 0) {
        fs.writeFileSync(util.format("%s/usermanagement.json", configDir), stringify(usermanagement, { maxLength: 120 }), "utf8");
    }
    if (classes.length > 0) {
        fs.writeFileSync(util.format("%s/classes.json", configDir), stringify(classes, { maxLength: 100 }), "utf8");
    }
    if (classPerms.length > 0) {
        fs.writeFileSync(util.format("%s/classPerms.json", configDir), stringify(classPerms, { maxLength: 100 }), "utf8");
    }
    if (attrPerms.length > 0) {
        fs.writeFileSync(util.format("%s/attrPerms.json", configDir), stringify(attrPerms, { maxLength: 100 }), "utf8");
    }
    if (structure.length > 0) {
        fs.writeFileSync(util.format("%s/structure.json", configDir), stringify(structure, { maxLength: 80 }), "utf8");
    }
    if (helperSqlFiles.size > 0) {
        helperSqlFiles.forEach(async (value, key) => {
            fs.writeFileSync(util.format("%s/%s", structureHelperStatementsFolder, key), value, "utf8");
        });
    }
    if (structureSqlFiles.size > 0) {
        fs.writeFileSync(util.format("%s/dynchildhelpers.json", configDir), stringify(dynchildhelpers, { maxLength: 80 }), "utf8");
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
