import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import { extname } from 'path';
import { logOut, logVerbose } from './tools';
import { normalizeConfig } from '../normalize';

const structureDynamicChildrenFolderConst = "structure-dyn-children-stmnts";
const structureHelperStatementsFolderConst = "structure-helper-stmnts";
const confAttrXmlSnippetsFolderConst = "xml-config-attrs";

export function readConfigJsonFile(file) {    
    if (!fs.existsSync(file)) {
        throw util.format("config file '%s' doesn't exist", file);
    }
    logVerbose(util.format("Reading config file '%s' ...", file));
    let config = readConfigFile(file, true) ;
    return normalizeConfig(config);
}

export function readConfigFile(file, sub = false) {    
    logVerbose(util.format("%s config file '%s'", sub ? " ↳ reading" : "Reading", file));
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, {encoding: 'utf8'})) : undefined
}

export function writeConfigFile(config, file, sub = false) {    
    writeFile(config != null ? stringify(config, { maxLength: global.config.maxFileLength }): null, file, sub);
}

function writeFile(content, file, sub = false) {    
    if (content != null) {
        logVerbose(util.format("%s file '%s'", sub ? " ↳ writing" : "Writing", file));
        fs.writeFileSync(file, content, "utf8");
    } else if (fs.existsSync(file)) {
        logVerbose(util.format("%s file '%s'", sub ? " ↳ deleting" : "Deleting", file));
        fs.rmSync(file);
    }
}

export function readConfigFiles(configsDir, topics) {
    logOut(util.format("Reading config directory '%s' ...", configsDir));
    if (!fs.existsSync(configsDir)) {
        throw util.format("readConfigFiles: %s does not exist", configsDir);
    }

    if (
        fs.existsSync(configsDir) 
        && fs.statSync(configsDir).isDirectory() 
        && !fs.existsSync(util.format("%s/config.json", configsDir))
    ) {
        throw util.format("checkConfigFolders: target directory %s exists but has no config.json", configsDir);
    }    
    let config = readConfigFile(util.format("%s/config.json", configsDir), true);
    let additionalInfos = readConfigFile(util.format("%s/additionalInfos.json", configsDir), true);

    let domains = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/domains.json", configsDir), true) : null;
    let usergroups = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/usergroups.json", configsDir), true) : null;
    let usermanagement = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/usermanagement.json", configsDir), true) : null;
    let xmlFiles = new Map();
    if (topics == null || topics.includes("accessControl")) {
        let confAttrXmlSnippetsFolder = util.format("%s/%s", configsDir, confAttrXmlSnippetsFolderConst);
        if (fs.existsSync(confAttrXmlSnippetsFolder)) {
            for (let file of fs.readdirSync(confAttrXmlSnippetsFolder)) {
                if (extname(file) == ".xml") {
                    xmlFiles.set(file, fs.readFileSync(util.format("%s/%s", confAttrXmlSnippetsFolder, file), {encoding: 'utf8'}));    
                }
            }    
        }
    }

    let policyRules = topics == null || topics.includes("classes") ? readConfigFile(util.format("%s/policyRules.json", configsDir), true) : null;
    let classPerms = topics == null || topics.includes("classes") ? readConfigFile(util.format("%s/classPerms.json", configsDir), true) : null;
    let attrPerms = topics == null || topics.includes("classes") ? readConfigFile(util.format("%s/attrPerms.json", configsDir), true) : null;
    let classes = topics == null || topics.includes("classes") ? readConfigFile(util.format("%s/classes.json", configsDir), true) : null;

    let structure = topics == null || topics.includes("structure") ? readConfigFile(util.format("%s/structure.json", configsDir), true) : null;
    let dynchildhelpers = topics == null || topics.includes("structure") ? readConfigFile(util.format("%s/dynchildhelpers.json", configsDir), true) : null;

    let structureSqlFiles=new Map();
    let helperSqlFiles=new Map();

    if (topics == null || topics.includes("structure")) {
        let structureDynamicChildrenFolder = util.format("%s/%s", configsDir, structureDynamicChildrenFolderConst);
        if (fs.existsSync(structureDynamicChildrenFolder)) {
            for (let file of fs.readdirSync(structureDynamicChildrenFolder)) {
                if (extname(file) == ".sql") {
                    structureSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureDynamicChildrenFolder, file), {encoding: 'utf8'}));    
                }
            }    
        }

        let structureHelperStatementsFolder = util.format("%s/%s", configsDir, structureHelperStatementsFolderConst);
        if (fs.existsSync(structureHelperStatementsFolder)) {
            for (let file of fs.readdirSync(structureHelperStatementsFolder)) {
                if (extname(file) == ".sql") {
                    helperSqlFiles.set(file, fs.readFileSync(util.format("%s/%s", structureHelperStatementsFolder, file), {encoding: 'utf8'}));    
                }
            }    
        }
    }

    return {
        config,
        additionalInfos,
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

export function writeConfigFiles(configs, configsDir) {
    let {
        config,
        additionalInfos,
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
    } = configs;

    if (
        fs.existsSync(configsDir) 
        && fs.statSync(configsDir).isDirectory() 
        && !fs.existsSync(util.format("%s/config.json", configsDir)) 
        && fs.readdirSync(configsDir).length !== 0
    ) {
        throw util.format("checkConfigFolders: target directory %s exists but is not empty and has no config.json", configsDir);
    }

    logOut(util.format("Writing config directory '%s' ...", configsDir));

    let confAttrXmlSnippetsFolder = util.format("%s/%s", configsDir, confAttrXmlSnippetsFolderConst);
    let structureDynamicChildrenFolder = util.format("%s/%s", configsDir, structureDynamicChildrenFolderConst);
    let structureHelperStatementsFolder = util.format("%s/%s", configsDir, structureHelperStatementsFolderConst);

    // create configsDir structure

    if (fs.existsSync(configsDir)) {
        //fs.rmSync(configsDir, { recursive: true, force: true }) // DANGER!!!
    }
    if (!fs.existsSync(configsDir)) {
        fs.mkdirSync(configsDir);
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

    writeConfigFile(config, util.format("%s/config.json", configsDir), true);
    writeConfigFile(additionalInfos, util.format("%s/additionalInfos.json", configsDir), true);
    writeConfigFile(domains, util.format("%s/domains.json", configsDir), true);
    writeConfigFile(policyRules, util.format("%s/policyRules.json", configsDir), true);
    writeConfigFile(usergroups, util.format("%s/usergroups.json", configsDir), true);
    writeConfigFile(usermanagement, util.format("%s/usermanagement.json", configsDir), true);
    writeConfigFile(classes, util.format("%s/classes.json", configsDir), true);
    writeConfigFile(classPerms, util.format("%s/classPerms.json", configsDir), true);
    writeConfigFile(attrPerms, util.format("%s/attrPerms.json", configsDir), true);
    writeConfigFile(structure, util.format("%s/structure.json", configsDir), true);
    writeConfigFile(dynchildhelpers, util.format("%s/dynchildhelpers.json", configsDir), true);

    if (helperSqlFiles != null && helperSqlFiles.size > 0) {
        helperSqlFiles.forEach(async (value, key) => {
            writeFile(value, util.format("%s/%s", structureHelperStatementsFolder, key), true)
        });
    }
    if (structureSqlFiles != null && structureSqlFiles.size > 0) {
        structureSqlFiles.forEach(async (value, key) => {
            writeFile(value, util.format("%s/%s", structureDynamicChildrenFolder, key), true)
        });
    }
    if (xmlFiles != null && xmlFiles.size > 0) {
        xmlFiles.forEach(async (xmlToSave, fileName) => {
            writeFile(xmlToSave, util.format("%s/%s", confAttrXmlSnippetsFolder, fileName), true)
        });
    }
}