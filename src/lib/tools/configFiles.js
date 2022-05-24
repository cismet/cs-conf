import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import { extname } from 'path';
import * as constants from './constants.js';

export function readConfigFiles(folder) {
    if (!fs.existsSync(folder)) {
        throw util.format("%s does not exist", folder);
    }

    let domains = JSON.parse(fs.readFileSync(util.format("%s/domains.json", folder), {encoding: 'utf8'}));
    let policyRules = JSON.parse(fs.readFileSync(util.format("%s/policyRules.json", folder), {encoding: 'utf8'}));
    let usergroups = JSON.parse(fs.readFileSync(util.format("%s/usergroups.json", folder), {encoding: 'utf8'}));
    let usermanagement = JSON.parse(fs.readFileSync(util.format("%s/usermanagement.json", folder), {encoding: 'utf8'}));
    let classes = JSON.parse(fs.readFileSync(util.format("%s/classes.json", folder), {encoding: 'utf8'}));
    let classPerms = JSON.parse(fs.readFileSync(util.format("%s/classPerms.json", folder), {encoding: 'utf8'}));
    //let normalizedClassPerms = JSON.parse(fs.readFileSync(util.format("%s/normalizedClassPerms.json", folder), {encoding: 'utf8'}));
    let attrPerms = JSON.parse(fs.readFileSync(util.format("%s/attrPerms.json", folder), {encoding: 'utf8'}));
    //let normalizedAttrPerms = JSON.parse(fs.readFileSync(util.format("%s/normalizedAttrPerms.json", folder), {encoding: 'utf8'}));
    let structure = JSON.parse(fs.readFileSync(util.format("%s/structure.json", folder), {encoding: 'utf8'}));
    let dynchildhelpers = JSON.parse(fs.readFileSync(util.format("%s/dynchildhelpers.json", folder), {encoding: 'utf8'}));

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
        //normalizedClassPerms, 
        attrPerms, 
        //normalizedAttrPerms, 
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
        //normalizedClassPerms,
        attrPerms,
        //normalizedAttrPerms,
        structure,
        structureSqlDocuments,
        dynchildhelpers,
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

    fs.writeFileSync(util.format("%s/domains.json", folder), stringify(domains), "utf8");
    fs.writeFileSync(util.format("%s/policyRules.json", folder), stringify(policyRules), "utf8");
    fs.writeFileSync(util.format("%s/usergroups.json", folder), stringify(usergroups, { maxLength: 160 }), "utf8");
    fs.writeFileSync(util.format("%s/usermanagement.json", folder), stringify(usermanagement, { maxLength: 120 }), "utf8");
    fs.writeFileSync(util.format("%s/classes.json", folder), stringify(classes, { maxLength: 100 }), "utf8");
    fs.writeFileSync(util.format("%s/classPerms.json", folder), stringify(classPerms, { maxLength: 100 }), "utf8");
    //fs.writeFileSync(util.format("%s/normalizedClassPerms.json", folder), stringify(normalizedClassPerms, { maxLength: 100 }), "utf8");
    fs.writeFileSync(util.format("%s/attrPerms.json", folder), stringify(attrPerms, { maxLength: 100 }), "utf8");
    //fs.writeFileSync(util.format("%s/normalizedAttrPerms.json", folder), stringify(normalizedAttrPerms, { maxLength: 100 }), "utf8");
    fs.writeFileSync(util.format("%s/structure.json", folder), stringify(structure, { maxLength: 80 }), "utf8");
    helperSqlDocuments.forEach(async (value, key) => {
        fs.writeFileSync(util.format("%s/%s", structureHelperStatementsFolder, key), value, "utf8");
    });
    fs.writeFileSync(util.format("%s/dynchildhelpers.json", folder), stringify(dynchildhelpers, { maxLength: 80 }), "utf8");
    structureSqlDocuments.forEach(async (value, key) => {
        fs.writeFileSync(util.format("%s/%s", structureDynamicChildrenFolder, key), value, "utf8");
    });
    xmlFiles.forEach(async (xmlToSave, fileName) => {
        fs.writeFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, fileName), xmlToSave, "utf8");
    });
}
