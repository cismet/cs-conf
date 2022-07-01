import chai from 'chai';
import util from 'util';
import { readConfigFile } from '../src/lib/tools/configFiles';
import normalizeAttrPerms from '../src/lib/normalize/attrPerms';
import normalizeClasses from '../src/lib/normalize/classes';
import normalizeClassPerms from '../src/lib/normalize/classPerms';
import normalizeDomains from '../src/lib/normalize/domains';
import normalizeDynchildhelpers from '../src/lib/normalize/dynchildhelpers';
import normalizePolicyRules from '../src/lib/normalize/policyRules';
import normalizeStructure from '../src/lib/normalize/structure';
import normalizeUsergroups from '../src/lib/normalize/usergroups';
import normalizeUsermanagement from '../src/lib/normalize/usermanagement';
import normalizeConfigurationAttributes from '../src/lib/normalize/configurationAttributes';
import simplifyConfigurationAttributes from '../src/lib/simplify/configurationAttributes';
import simplifyAttrPerms from '../src/lib/simplify/attrPerms';
import simplifyClassPerms from '../src/lib/simplify/classPerms';
import simplifyClasses from '../src/lib/simplify/classes';
import simplifyDomains from '../src/lib/simplify/domains';
import simplifyDynchildhelpers from '../src/lib/simplify/dynchildhelpers';
import simplifyPolicyRules from '../src/lib/simplify/policyRules';
import simplifyUsergroups from '../src/lib/simplify/usergroups';
import simplifyUsermanagement from '../src/lib/simplify/usermanagement';
import simplifyStructure from '../src/lib/simplify/structure';
import reorganizeAttrPerms from '../src/lib/reorganize/attrPerms';
import reorganizeClassPerms from '../src/lib/reorganize/classPerms';
import reorganizeClasses from '../src/lib/reorganize/classes';
import reorganizeDomains from '../src/lib/reorganize/domains';
import reorganizeDynchildhelpers from '../src/lib/reorganize/dynchildhelpers';
import reorganizePolicyRules from '../src/lib/reorganize/policyRules';
import reorganizeStructure from '../src/lib/reorganize/usergroups';
import reorganizeManagement from '../src/lib/reorganize/usermanagement';
import reorganizeConfigurationAttributes from '../src/lib/reorganize/configurationAttributes';

let should = chai.should();
let expect = chai.expect;

const folderNormalize = "./test/configs/normalize";
const folderNormalized = "./test/configs/normalized";
const folderSimplify = "./test/configs/simplify"; // TODO
const folderSimplified = "./test/configs/simplified"; // TODO
const folderReorganize = "./test/configs/reorganize"; // TODO
const folderReorganized = "./test/configs/reorganized"; // TODO

const allFunctions = {
    'configurationAttributes': { normalize: normalizeConfigurationAttributes, simplify: simplifyConfigurationAttributes, reorganize: reorganizeConfigurationAttributes, },
    'attrPerms': { normalize: normalizeAttrPerms, simplify: simplifyAttrPerms, reorganize: reorganizeAttrPerms, },
    'classPerms': { normalize: normalizeClassPerms, simplify: simplifyClassPerms, reorganize: reorganizeClassPerms, },
    'classes': { normalize: normalizeClasses, simplify: simplifyClasses, reorganize: reorganizeClasses, },
    'domains': { normalize: normalizeDomains, simplify: simplifyDomains, reorganize: reorganizeDomains, },
    'dynchildhelpers': { normalize: normalizeDynchildhelpers, simplify: simplifyDynchildhelpers, reorganize: reorganizeDynchildhelpers, },
    'policyRules': { normalize: normalizePolicyRules, simplify: simplifyPolicyRules, reorganize: reorganizePolicyRules, },
    'structure': { normalize: normalizeStructure, simplify: simplifyStructure, reorganize: null, },
    'usergroups': { normalize: normalizeUsergroups, simplify: simplifyUsergroups, reorganize: reorganizeStructure, },
    'usermanagement': { normalize: normalizeUsermanagement, simplify: simplifyUsermanagement, reorganize: reorganizeManagement, },
};

describe('Normalize:', () => {
    describe('empty: normalize([]) == []', testEmpty);
    describe('smoke1: normalize(expected) == normalized', testSmoke1);
    describe('smoke2: normalize(data) == normalized', testSmoke2);
    describe('smoke3: normalize(simplify(normalized)) == normalized', testSmoke3);
    describe('custom tests: policyRules', testPolicyRules);
});

function stringify(input) {
    return JSON.stringify(input, null, 2);
}

function clone(input) {
    return JSON.parse(JSON.stringify(input))
}

function expectEmptyArray(input, done) {
    expect(input).to.be.an('array');
    expect(input).to.be.empty;
    done();
}

function expectEqualJson(normalized, expected, done) {
    expect(stringify(normalized)).equals(stringify(expected));
    done();    
}

// ========== EMPTY ==========

function testEmpty() {
    for (let [ name, functions ] of Object.entries(allFunctions)) {
        it(name, (done) => {
            expectEmptyArray(functions.normalize([]), done)
        });
    }
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

// ========== CUSTOM ==========

function testPolicyRules() {
    it('missing policy', (done) => {
        let policyRules = readConfigFile(util.format("%s/policyRules.json", folderNormalize));
        let cloned = clone(policyRules);
        try {
            delete cloned[0].policy;
            normalizePolicyRules(cloned);
            should.fail('rule without policy is not allowed');
        } catch (error) {}
        done();
    });

    it('missing permission', (done) => {
        let policyRules = readConfigFile(util.format("%s/policyRules.json", folderNormalize));
        let cloned = clone(policyRules);
        try {
            delete cloned[0].permission;
            normalizePolicyRules(cloned);
            should.fail('rule without permission is not allowed');
        } catch (error) {}
        done();
    });

    it('missing value', (done) => {
        let policyRules = readConfigFile(util.format("%s/policyRules.json", folderNormalize));
        let cloned = clone(policyRules);
        try {
            delete cloned[0].value;
            normalizePolicyRules(cloned);
            should.fail('rule without value is not allowed');
        } catch (error) {}
        done();
    });
}