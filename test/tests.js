import chai from "chai";
import util from "util";
import { readConfigFile, readConfigFiles } from "../src/lib/tools/configFiles";
import {
  normalizeClasses,
  normalizeConfigurationAttributes,
  normalizeConfig,
  normalizeDomains,
  normalizeDynchildhelpers,
  normalizeStructure,
  normalizeUsergroups,
  normalizeUsermanagement,
  normalizeConfigs,
  normalizeSettings,
} from "../src/lib/normalize";
import {
  reorganizeClasses,
  reorganizeConfig,
  reorganizeConfigs,
  reorganizeDomains,
  reorganizeDynchildhelpers,
  reorganizeStructure,
  reorganizeUsermanagement,
} from "../src/lib/reorganize";
import {
  simplifyClasses,
  simplifyConfigurationAttributes,
  simplifyConfig,
  simplifyDomains,
  simplifyDynchildhelpers,
  simplifyStructure,
  simplifyUsergroups,
  simplifyUsermanagement,
  simplifyConfigs,
  simplifySettings,
} from "../src/lib/simplify";
import { checkConfigs } from "../src/lib/check";

let expect = chai.expect;

const folderNormalize = "./test/configs/normalize";
const folderNormalized = "./test/configs/normalized";

const allFunctions = {
    settings: {
        load: (path) => readConfigFile(util.format("%s/settings.json", path)),
        normalize: normalizeSettings,
        simplify: simplifySettings,
        reorganize: null,
    },
    configs: {
        load: (path) => Object.assign(readConfigFiles(path), path == folderNormalized ? { normalized: true } : undefined),
        normalize: normalizeConfigs,
        simplify: simplifyConfigs,
        reorganize: reorganizeConfigs,
    },
    config: {
        load: (path) => readConfigFile(util.format("%s/config.json", path)),
        normalize: normalizeConfig,
        simplify: simplifyConfig,
        reorganize: reorganizeConfig,
    },
    classes: {
        load: (path) => readConfigFile(util.format("%s/classes.json", path)),
        normalize: normalizeClasses,
        simplify: simplifyClasses,
        reorganize: reorganizeClasses,
    },
    dynchildhelpers: {
        load: (path) => readConfigFile(util.format("%s/dynchildhelpers.json", path)),
        normalize: normalizeDynchildhelpers,
        simplify: simplifyDynchildhelpers,
        reorganize: reorganizeDynchildhelpers,
    },
    structure: {
        load: (path) => readConfigFile(util.format("%s/structure.json", path)),
        normalize: normalizeStructure,
        simplify: simplifyStructure,
        reorganize: null,
    },
    configurationAttributes: {
        load: (path) => readConfigFile(util.format("%s/configurationAttributes.json", path)),
        normalize: normalizeConfigurationAttributes,
        simplify: simplifyConfigurationAttributes,
        reorganize: null,
    },
    domains: {
        load: (path) => readConfigFile(util.format("%s/domains.json", path)),
        normalize: normalizeDomains,
        simplify: simplifyDomains,
        reorganize: reorganizeDomains,
    },
    usergroups: {
        load: (path) => readConfigFile(util.format("%s/usergroups.json", path)),
        normalize: normalizeUsergroups,
        simplify: simplifyUsergroups,
        reorganize: reorganizeStructure,
    },
    usermanagement: {
        load: (path) => readConfigFile(util.format("%s/usermanagement.json", path)),
        normalize: normalizeUsermanagement,
        simplify: simplifyUsermanagement,
        reorganize: reorganizeUsermanagement,
    },
};

global.silent = true;
global.config = readConfigFile(
    util.format("%s/%s", folderNormalize, "config.json")
  );

describe("normalize:", () => {
    describe("normalize('normalize/') == 'normalized/'", testNormalize1);
    describe("normalize('normalized/') == 'normalized/'", testNormalize2);
});

describe("simplify:", () => {
    describe("simplify('normalize/') == simplify('normalized/')", testSimplify1);
});
  
describe("check:", () => {
    describe("check: check('normalize/')", testCheck);
});

function stringify(input) {
  return JSON.stringify(input, null, 2);
}

function clone(input) {
  return JSON.parse(JSON.stringify(input));
}

function expectEqualJson(normalized, expected, done) {
  expect(stringify(normalized)).equals(stringify(expected));
  done();
}

// ========== SMOKE ==========

function testNormalize1() {
    for (let [name, functions] of Object.entries(allFunctions)) {
        if (functions.normalize !== null) {
            it(name, (done) => {
                let configA = functions.normalize(functions.load(folderNormalize));
                let configB = functions.load(folderNormalized);
                expectEqualJson(configA, configB, done);
            });
        }
    }
}

function testNormalize2() {
    for (let [name, functions] of Object.entries(allFunctions)) {
        if (functions.normalize !== null) {
            it(name, (done) => {
                let configA = functions.load(folderNormalized);
                let configB = functions.normalize(configA);
                expectEqualJson(configA, configB, done);
            });
        }
    }
}

function testSimplify1() {
  for (let [name, functions] of Object.entries(allFunctions)) {
    if (functions.normalize !== null && functions.simplify !== null) {
      it(name, (done) => {
        let configA = functions.simplify(functions.load(folderNormalize));
        let configB = functions.simplify(functions.load(folderNormalized));
        expectEqualJson(configA, configB, done);
      });
    }
  }
}

function testCheck() {
    let configs = readConfigFiles(folderNormalize);
    it("check", (done) => {
        checkConfigs(configs);
        done();
    });
}
