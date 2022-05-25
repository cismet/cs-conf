import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import { extname } from 'path';
import * as constants from './constants.js';

export function readConfigFiles(folder) {
    if (!fs.existsSync(folder)) {
        throw util.format("%s does not exist", folder);
    }

    let domainsFile = util.format("%s/domains.json", folder);
    let policyRulesFile = util.format("%s/policyRules.json", folder);
    let usergroupsFile = util.format("%s/usergroups.json", folder);
    let usermanagementFile = util.format("%s/usermanagement.json", folder);
    let classesFile = util.format("%s/classes.json", folder);
    let classPermsFile = util.format("%s/classPerms.json", folder);
    //let normalizedClassPermsFile = util.format("%s/normalizedClassPerms.json", folder);
    let attrPermsFile =util.format("%s/attrPerms.json", folder);
    //let normalizedAttrPermsFile = util.format("%s/normalizedAttrPerms.json", folder);
    let structureFile = util.format("%s/structure.json", folder);
    let dynchildhelpersFile = util.format("%s/dynchildhelpers.json", folder);

    let domains = fs.existsSync(domainsFile) ? JSON.parse(fs.readFileSync(domainsFile, {encoding: 'utf8'})) : [];
    let policyRules = fs.existsSync(policyRulesFile) ? JSON.parse(fs.readFileSync(policyRulesFile, {encoding: 'utf8'})) : [];
    let usergroups = fs.existsSync(usergroupsFile) ? JSON.parse(fs.readFileSync(usergroupsFile, {encoding: 'utf8'})) : [];
    let usermanagement = fs.existsSync(usermanagementFile) ? JSON.parse(fs.readFileSync(usermanagementFile, {encoding: 'utf8'})) : [];
    let classes = fs.existsSync(classesFile) ? JSON.parse(fs.readFileSync(classesFile, {encoding: 'utf8'})) : [];
    let classPerms = fs.existsSync(classPermsFile) ? JSON.parse(fs.readFileSync(classPermsFile, {encoding: 'utf8'})) : [];
    //let normalizedClassPerms = fs.existsSync(normalizedClassPermsFile) ? JSON.parse(fs.readFileSync(normalizedClassPermsFile, {encoding: 'utf8'})) : [];
    let attrPerms = fs.existsSync(attrPermsFile) ? JSON.parse(fs.readFileSync(attrPermsFile, {encoding: 'utf8'})) : [];
    //let normalizedAttrPerms = fs.existsSync(normalizedAttrPermsFile) ? JSON.parse(fs.readFileSync(normalizedAttrPermsFile, {encoding: 'utf8'})) : [];
    let structure = fs.existsSync(structureFile) ? JSON.parse(fs.readFileSync(structureFile, {encoding: 'utf8'})) : [];
    let dynchildhelpers = fs.existsSync(dynchildhelpersFile) ? JSON.parse(fs.readFileSync(dynchildhelpersFile, {encoding: 'utf8'})) : [];

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

export function writeConfigFiles(folder, config, overwrite = false) {
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
        structureSqlDocuments,
        helperSqlDocuments,
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
    if (structureSqlDocuments.size > 0) {
        fs.mkdirSync(structureDynamicChildrenFolder);
    }

    if (fs.existsSync(structureHelperStatementsFolder)) {
        fs.rmSync(structureHelperStatementsFolder, { recursive: true, force: true });
    }
    if (helperSqlDocuments.size > 0) {
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
    if (helperSqlDocuments.size > 0) {
        helperSqlDocuments.forEach(async (value, key) => {
            fs.writeFileSync(util.format("%s/%s", structureHelperStatementsFolder, key), value, "utf8");
        });
    }
    if (structureSqlDocuments.size > 0) {
        fs.writeFileSync(util.format("%s/dynchildhelpers.json", folder), stringify(dynchildhelpers, { maxLength: 80 }), "utf8");
        structureSqlDocuments.forEach(async (value, key) => {
            fs.writeFileSync(util.format("%s/%s", structureDynamicChildrenFolder, key), value, "utf8");
        });
    }        
    if (xmlFiles.size > 0) {
        xmlFiles.forEach(async (xmlToSave, fileName) => {
            fs.writeFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, fileName), xmlToSave, "utf8");
        });
    }
}
