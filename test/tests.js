import chai from 'chai';
import util from 'util';
import { readConfigFile } from '../src/lib/tools/configFiles';
import { 
    normalizeClasses, 
    normalizeDomains, 
    normalizeDynchildhelpers, 
    normalizePolicyRules, 
    normalizeStructure, 
    normalizeUsergroups, 
    normalizeUsermanagement 
} from '../src/lib/normalize';
import { 
    reorganizeClasses, 
    reorganizeDomains, 
    reorganizeDynchildhelpers, 
    reorganizePolicyRules, 
    reorganizeStructure, 
    reorganizeUsermanagement 
} from '../src/lib/reorganize';
import { 
    simplifyClasses, 
    simplifyDomains, 
    simplifyDynchildhelpers, 
    simplifyPolicyRules, 
    simplifyStructure, 
    simplifyUsergroups, 
    simplifyUsermanagement 
} from '../src/lib/simplify';

let should = chai.should();
let expect = chai.expect;

const folderNormalize = "./test/configs/normalize";
const folderNormalized = "./test/configs/normalized";
const folderSimplify = "./test/configs/simplify"; // TODO
const folderSimplified = "./test/configs/simplified"; // TODO
const folderReorganize = "./test/configs/reorganize"; // TODO
const folderReorganized = "./test/configs/reorganized"; // TODO

const allFunctions = {
    'domains': { normalize: normalizeDomains, simplify: simplifyDomains, reorganize: reorganizeDomains, },
    'usergroups': { normalize: normalizeUsergroups, simplify: simplifyUsergroups, reorganize: reorganizeStructure, },
    'usermanagement': { normalize: normalizeUsermanagement, simplify: simplifyUsermanagement, reorganize: reorganizeUsermanagement, },
    'classes': { normalize: normalizeClasses, simplify: simplifyClasses, reorganize: reorganizeClasses, },
    'dynchildhelpers': { normalize: normalizeDynchildhelpers, simplify: simplifyDynchildhelpers, reorganize: reorganizeDynchildhelpers, },
    'structure': { normalize: normalizeStructure, simplify: simplifyStructure, reorganize: null, },
};

describe('Normalize:', () => {
    global.config = { domainName: "TEST "};
    describe('smoke1: normalize(expected) == normalized', testSmoke1);
    describe('smoke2: normalize(data) == normalized', testSmoke2);
    describe('smoke3: normalize(simplify(normalized)) == normalized', testSmoke3);
});

function stringify(input) {
    return JSON.stringify(input, null, 2);
}

function clone(input) {
    return JSON.parse(JSON.stringify(input))
}

function expectEqualJson(normalized, expected, done) {
    expect(stringify(normalized)).equals(stringify(expected));
    done();    
}

// ========== SMOKE ==========

function testSmoke1() {
    for (let [ name, functions ] of Object.entries(allFunctions)) {
        if (functions.normalize !== null) {
            let fileName = util.format('%s.json', name);
            it(name, (done) => {
                let data = readConfigFile(util.format('%s/%s', folderNormalize, fileName));
                let normalized = functions.normalize(data);            
                let expected = readConfigFile(util.format('%s/%s', folderNormalized, fileName));
                expectEqualJson(normalized, expected, done);
            });
        }
    }
}

function testSmoke2() {
    for (let [ name, functions ] of Object.entries(allFunctions)) {
        if (functions.normalize !== null) {
            let fileName = util.format('%s.json', name);
            it(name, (done) => {
                let expected = readConfigFile(util.format('%s/%s', folderNormalized, fileName));
                let normalized = functions.normalize(expected);            
                expectEqualJson(expected, normalized, done);
            });
        }
    }
}

function testSmoke3() {
    for (let [ name, functions ] of Object.entries(allFunctions)) {
        if (functions.normalize !== null && functions.simplify !== null) {
            let fileName = util.format('%s.json', name);
            it(name, (done) => {
                let expected = readConfigFile(util.format('%s/%s', folderNormalized, fileName));
                let simplified = functions.simplify(expected);
                let normalized = functions.normalize(simplified);         
                expectEqualJson(normalized, expected, done);
            });
        }
    }
}