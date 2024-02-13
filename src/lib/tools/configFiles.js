import fs from 'fs';
import util from 'util';
import stringify from 'json-stringify-pretty-compact';
import path, { extname } from 'path';
import os from 'os';
import { logOut, logVerbose } from './tools';
import { normalizeConfig, normalizeSettings } from '../normalize';
import { version } from '../../../package.json';

const structureDynamicChildrenFolderConst = "structure-dyn-children-stmnts";
const structureHelperStatementsFolderConst = "structure-helper-stmnts";
const confAttrXmlSnippetsFolderConst = "xml-config-attrs";

export function getSettingsDir() {
    let settingsDir = path.join(os.homedir(), '.csconf');
    return settingsDir;
}

export function getSettingsJsonFile() {
    let settingsFile = path.join(getSettingsDir(), 'settings.json');
    return settingsFile;
}

export function readSettingsJsonFile(settingsFile = getSettingsJsonFile()) {
    let settings = {};
    if (fs.existsSync(settingsFile)) {
        logVerbose(util.format("Reading settings file '%s' ...", settingsFile));
        Object.assign(settings, readConfigFile(settingsFile, true));
    }
    let normalized = normalizeSettings(settings);
    let majorVersion = getFormatVersion();
    if (normalized.formatVersion != majorVersion) throw Error(util.format("the format version of the configuration files (%d) not compatible with the major version of csconf (%d)", normalized.formatVersion, majorVersion));
    return normalized;
}

export function readConfigJsonFile(file) {    
    if (!fs.existsSync(file)) throw Error(util.format("config file '%s' doesn't exist", file));
    logVerbose(util.format("Reading config file '%s' ...", file));
    let config = readConfigFile(file, true);
    let normalized = normalizeConfig(config);
    let majorVersion = getFormatVersion();
    if (normalized.formatVersion != majorVersion) throw Error(util.format("the format version of the configuration files (%d) not compatible with the major version of csconf (%d)", normalized.formatVersion, majorVersion));
    return normalized;
}
 
export function getFormatVersion() {
    let majorVersion =  parseInt(version.split('.')[0]);
    return majorVersion;
}

export function readConfigFile(file, sub = false) {    
    logVerbose(util.format("%s config file '%s'", sub ? " ↳ reading" : "Reading", file));

    if (!fs.existsSync(file)) return undefined;

    let fileContent = fs.readFileSync(file, {encoding: 'utf8'});
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        throw Error(util.format("Error while parsing '%s'", file), e)
    }
}

export function writeConfigFile(config, file, sub = false) {    
    writeOrDeleteFile(config != null ? stringify(config, { maxLength: global.config ? global.config.maxFileLength : 80 }): null, file, { sub });
}

function writeOrDeleteFile(content, file, { sub = false, verboseOnly = true }) {    
    if (content != null) {
        writeFile(content, file, { sub, verboseOnly });
    } else if (fs.existsSync(file)) {
        deleteFile(file, { sub })
    }
}

export function writeFile(content, file, { sub = false, verboseOnly = true } ) {    
    let message = util.format("%s file '%s'", sub ? " ↳ writing" : "Writing", file);
    if (verboseOnly) {
        logVerbose(message);
    } else {
        logOut(message);
    }    
    fs.writeFileSync(file, content, "utf8");
}

export function deleteFile(file, { sub = false }) {    
    logVerbose(util.format("%s file '%s'", sub ? " ↳ deleting" : "Deleting", file));
    fs.rmSync(file);
}

export function readConfigFiles(configsDir, topics) {
    logOut(util.format("Reading config directory '%s' ...", configsDir));
    if (!fs.existsSync(configsDir)) throw Error(util.format("readConfigFiles: %s does not exist", configsDir));

    if (
        fs.existsSync(configsDir) 
        && fs.statSync(configsDir).isDirectory() 
        && !fs.existsSync(util.format("%s/config.json", configsDir))
    ) throw Error(util.format("checkConfigFolders: target directory %s exists but has no config.json", configsDir));
    let config = readConfigFile(util.format("%s/config.json", configsDir), true);
    let additionalInfos = readConfigFile(util.format("%s/additionalInfos.json", configsDir), true);

    let configurationAttributes = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/configurationAttributes.json", configsDir), true) : undefined;
    let domains = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/domains.json", configsDir), true) : undefined;
    let usergroups = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/usergroups.json", configsDir), true) : undefined;
    let usermanagement = topics == null || topics.includes("accessControl") ? readConfigFile(util.format("%s/usermanagement.json", configsDir), true) : undefined;
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

    let classes = topics == null || topics.includes("classes") ? readConfigFile(util.format("%s/classes.json", configsDir), true) : undefined;

    let structure = topics == null || topics.includes("structure") ? readConfigFile(util.format("%s/structure.json", configsDir), true) : undefined;
    let dynchildhelpers = topics == null || topics.includes("structure") ? readConfigFile(util.format("%s/dynchildhelpers.json", configsDir), true) : undefined;

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
        xmlFiles,
        configurationAttributes,
        domains, 
        usergroups, 
        usermanagement, 
        classes, 
        helperSqlFiles,
        dynchildhelpers,
        structureSqlFiles,
        structure, 
    }
}

export function writeConfigFiles(configs, configsDir) {
    let {
        config,
        additionalInfos,
        xmlFiles,
        configurationAttributes,
        domains,
        usergroups,
        usermanagement,
        classes,
        helperSqlFiles,
        dynchildhelpers,
        structureSqlFiles,
        structure,
    } = configs;

    configsDir = configsDir ?? global.configsDir;

    if (
        fs.existsSync(configsDir) 
        && fs.statSync(configsDir).isDirectory() 
        && !fs.existsSync(util.format("%s/config.json", configsDir)) 
        && fs.readdirSync(configsDir).length !== 0
    ) throw Error(util.format("checkConfigFolders: target directory %s exists but is not empty and has no config.json", configsDir));

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
    writeConfigFile(configurationAttributes, util.format("%s/configurationAttributes.json", configsDir), true);
    writeConfigFile(domains, util.format("%s/domains.json", configsDir), true);
    writeConfigFile(usergroups, util.format("%s/usergroups.json", configsDir), true);
    writeConfigFile(usermanagement, util.format("%s/usermanagement.json", configsDir), true);
    writeConfigFile(classes, util.format("%s/classes.json", configsDir), true);
    writeConfigFile(structure, util.format("%s/structure.json", configsDir), true);
    writeConfigFile(dynchildhelpers, util.format("%s/dynchildhelpers.json", configsDir), true);

    if (helperSqlFiles != null && helperSqlFiles.size > 0) {
        helperSqlFiles.forEach(async (value, key) => {
            writeOrDeleteFile(value, util.format("%s/%s", structureHelperStatementsFolder, key), { sub: true })
        });
    }
    if (structureSqlFiles != null && structureSqlFiles.size > 0) {
        structureSqlFiles.forEach(async (value, key) => {
            writeOrDeleteFile(value, util.format("%s/%s", structureDynamicChildrenFolder, key), { sub: true })
        });
    }
    if (xmlFiles != null && xmlFiles.size > 0) {
        xmlFiles.forEach(async (xmlToSave, fileName) => {
            writeOrDeleteFile(xmlToSave, util.format("%s/%s", confAttrXmlSnippetsFolder, fileName), { sub: true })
        });
    }
}