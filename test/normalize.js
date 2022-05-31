import chai from 'chai';
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

let should = chai.should();
let expect = chai.expect;

describe('Normalize:', () => {
    describe('configurationAttributes', testConfigurationAttributes);
    describe('attrPerms', testAttrPerms);
    describe('classPerms', testClassPerms);
    describe('classes', testClasses);
    describe('domains', testDomains);    
    describe('dynchildhelpers', testDynchildhelpers);
    describe('policyRules', testPolicyRules);    
    describe('structure', testStructure);
    describe('userGroups', testUserGroups);    
    describe('usermanagement', testUsermanagement);
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

// ========== CONFIGURATION ATTRIBUTES ==========

function testConfigurationAttributes() {

    let domains = JSON.parse(`[
        { "key": "inTestGroup", "keygroup": "testGroup" },
        { "key": "withoutGroupNorValue" },
        { "key": "InNoGroupWithValue", "keygroup": "__no_group__", "value": "test", "xmlfile": null }
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeConfigurationAttributes([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            { "key": "inTestGroup@LOCAL", "keygroup": "testGroup", "value": null, "xmlfile": null },
            { "key": "withoutGroupNorValue@LOCAL", "keygroup": "__no_group__", "value": null, "xmlfile": null },
            { "key": "InNoGroupWithValue@LOCAL", "keygroup": "__no_group__", "value": "test", "xmlfile": null }
        ]`);   
        let normalized = normalizeConfigurationAttributes(domains);            
        expectEqualJson(normalized, expected, done);
    });
}

// ========== ATTR PERMS ==========

function testAttrPerms() {

    let attrPerms = JSON.parse(`[
        {
            "key": "class1.attr1",
            "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"],
            "read": ["group1@DOMAIN", "group2@DOMAIN", "group3"]
        }, {
            "key": "class1.attr2",
            "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
        }, {
            "key": "class2.attr1",
            "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
        }, {
            "key": "class2.attr2"
        }          
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeAttrPerms([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "key": "class1.attr1",
                "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@LOCAL"],
                "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
                }, {
                "key": "class1.attr2",
                "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"],
                "write": []
            }, {
                "key": "class2.attr1",
                "read": [],
                "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
            }, {
                "key": "class2.attr2",
                "read": [],
                "write": []
            }          
        ]`);   
        let normalized = normalizeAttrPerms(attrPerms);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== CLASS PERMS ==========

function testClassPerms() {

    let classPerms = JSON.parse(`[
        {
            "table": "table1",
            "read": ["group1@DOMAIN", "group2@DOMAIN", "group3"],
            "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
        }, {
            "table": "table2",
            "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
        }, {
            "table": "table3",
            "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
        }, {
            "table": "table4"
        }          
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeClassPerms([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "table": "table1",
                "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@LOCAL"],
                "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
            }, {
                "table": "table2",
                "read": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"],
                "write": []
            }, {
                "table": "table3",
                "read": [],
                "write": ["group1@DOMAIN", "group2@DOMAIN", "group3@DOMAIN"]
            }, {
                "table": "table4",
                "read": [],
                "write": []
            }          
        ]`);   
        let normalized = normalizeClassPerms(classPerms);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== CLASSES ==========

function testClasses() {

    let classes = JSON.parse(`[
        {
            "table": "table1",
            "name": "Table 1",
            "attributes": [
                {
                    "field": "field1",
                    "name": "Field 1",
                    "dbType" : "TEXT"
                }
            ]
        }     
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeClassPerms([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "table": "table1",
                "name": "Table 1",
                "descr": null,
                "pk": null,
                "substitute": false,
                "extension_attr": false,
                "indexed": false,
                "classIcon": null,
                "objectIcon": null,
                "array_link": false,
                "policy": null,
                "toString": null,
                "editor": null,
                "renderer": null,                
                "attributes": [
                    {
                        "field": "field1",
                        "name": "Field 1",
                        "descr": null,
                        "dbType": "TEXT",
                        "extension_attr": false,
                        "precision": null,
                        "scale": null,
                        "cidsType": null,
                        "substitute": false,
                        "oneToMany": null,
                        "manyToMany": null,
                        "indexed": false,
                        "mandatory": false,
                        "hidden": false
                    }
                ],
                "additionalAttributes": null
            }          
        ]`); 
        let normalized = normalizeClasses(classes);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== DOMAINS ========== 
    
function testDomains() {

    let domains = JSON.parse(`[
        {
          "domainname": "LOCAL",
          "configurationAttributes": [{ "key": "test" }]
        }, { 
            "domainname": "TEST" 
        }
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeDomains([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "domainname": "LOCAL",
                "configurationAttributes": [{ "key": "test@LOCAL", "keygroup": "__no_group__", "value": null, "xmlfile": null }]
            }, { 
                "domainname": "TEST",
                "configurationAttributes": []
            }
        ]`);   
        let normalized = normalizeDomains(domains);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== DYNCHILDHELPERS ==========

function testDynchildhelpers() {

    let domains = JSON.parse(`[
        {
          "name": "helper1",
          "code" : "SELECT stuff FROM somewhere"
        }, { 
            "name": "helper2",
            "code_file" : "helper2.sql"
        }
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeDynchildhelpers([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "name": "helper1",
                "code" : "SELECT stuff FROM somewhere",
                "code_file" : null
              }, { 
                  "name": "helper2",
                  "code": null,
                  "code_file" : "helper2.sql"
              }
        ]`);   
        let normalized = normalizeDynchildhelpers(domains);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== POLICY RULES ==========

function testPolicyRules() {

    let policyRules = JSON.parse(`[
        {"policy": "SECURE", "permission": "read", "default_value": false},
        {"policy": "SECURE", "permission": "write", "default_value": false},
        {"policy": "STANDARD", "permission": "read", "default_value": true},
        {"policy": "STANDARD", "permission": "write", "default_value": false},
        {"policy": "WIKI", "permission": "read", "default_value": true},
        {"policy": "WIKI", "permission": "write", "default_value": true}
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizePolicyRules([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {"policy": "SECURE", "permission": "read", "default_value": false},
            {"policy": "SECURE", "permission": "write", "default_value": false},
            {"policy": "STANDARD", "permission": "read", "default_value": true},
            {"policy": "STANDARD", "permission": "write", "default_value": false},
            {"policy": "WIKI", "permission": "read", "default_value": true},
            {"policy": "WIKI", "permission": "write", "default_value": true}
        ]`);
        let normalized = normalizePolicyRules(policyRules);
        expectEqualJson(normalized, expected, done);
    });

    it('missing policy', (done) => {
        let cloned = clone(policyRules);
        try {
            delete cloned[0].policy;
            normalizePolicyRules(cloned);
            should.fail('rule without policy is not allowed');
        } catch (error) {}
        done();
    });

    it('missing permission', (done) => {
        let cloned = clone(policyRules);
        try {
            delete cloned[0].permission;
            normalizePolicyRules(cloned);
            should.fail('rule without permission is not allowed');
        } catch (error) {}
        done();
    });

    it('missing value', (done) => {
        let cloned = clone(policyRules);
        try {
            delete cloned[0].value;
            normalizePolicyRules(cloned);
            should.fail('rule without value is not allowed');
        } catch (error) {}
        done();
    });
}

// ========== STRUCTURE ==========

function testStructure() {

    let structure = JSON.parse(`[
        {
            "name": "Node 1",
            "table": "table1",
            "derive_permissions_from_class": true,
            "org": "Org.1",
            "policy": "STANDARD",
            "dynamic_children_file": "node1.sql"
        }, {
            "name": "Node 2",
            "table": "table1",
            "org": "Org.2",
            "children": [
                {
                    "name": "Node 3",
                    "table": "table2",
                    "dynamic_children_file": "node3.sql"        
                }
            ]
        }

    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeStructure([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "name": "Node 1",
                "table": "table1",
                "derive_permissions_from_class": true,
                "org": "Org.1",
                "object_id": null,
                "policy": "STANDARD",
                "readPerms": [],
                "writePerms": [],
                "node_type": "N",
                "dynamic_children_file": "node1.sql",
                "children": []
            },
            {
                "name": "Node 2",
                "table": "table1",
                "derive_permissions_from_class": false,
                "org": "Org.2",
                "object_id": null,
                "policy": null,
                "readPerms": [],
                "writePerms": [],
                "node_type": "N",
                "dynamic_children_file": null,
                "children": [
                    {
                        "name": "Node 3",
                        "table": "table2",
                        "derive_permissions_from_class": false,
                        "org": null,
                        "object_id": null,
                        "policy": null,
                        "readPerms": [],
                        "writePerms": [],
                        "node_type": "N",
                        "dynamic_children_file": "node3.sql",
                        "children": []
                    }
                ]
            }
        ]`);   
        let normalized = normalizeStructure(structure);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== USER GROUPS ==========

function testUserGroups() {

    let usergroups = JSON.parse(`[
        {
            "key": "Group1",
            "descr": "Descr1",
            "configurationAttributes": [{ "key": "test" }]
        }, { 
            "key": "Group2" 
        }
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeUsergroups([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "key": "Group1@LOCAL",
                "descr": "Descr1",
                "configurationAttributes": [{ "key": "test@LOCAL", "keygroup": "__no_group__", "value": null, "xmlfile": null }]
            }, { 
                "key": "Group2@LOCAL",
                "descr": null,
                "configurationAttributes": []
            }
        ]`);   
        let normalized = normalizeUsergroups(usergroups);
        expectEqualJson(normalized, expected, done);
    });
}

// ========== USERMANAGEMENT ==========

function testUsermanagement() {

    let usermanagement = JSON.parse(`[
        {
            "login_name": "User1",
            "administrator": true,
            "pw_hash": "HashyHash1",
            "salt": "saltySalt1",
            "groups": ["Group1", "Group2"],
            "configurationAttributes": [{ "key": "test" }]
        }, {
            "login_name": "User2",
            "pw_hash": "HashyHash2",
            "salt": "saltySalt2",
            "groups": ["Group3"]
        }, {
            "login_name": "User3",
            "pw_hash": "HashyHash3",
            "salt": "saltySalt3",
            "configurationAttributes": []
        }, {
            "login_name": "User4",
            "pw_hash": "HashyHash4",
            "salt": "saltySalt4"
        }
    ]`);

    it('empty', (done) => {
        expectEmptyArray(normalizeUsermanagement([]), done);
    });

    it('normal', (done) => {
        let expected = JSON.parse(`[
            {
                "login_name": "User1",
                "administrator": true,
                "pw_hash": "HashyHash1",
                "salt": "saltySalt1",
                "groups": ["Group1@LOCAL", "Group2@LOCAL"],
                "configurationAttributes": [ { "key": "test@LOCAL", "keygroup": "__no_group__", "value": null, "xmlfile": null } ]
            }, {
                "login_name": "User2",
                "administrator": false,
                "pw_hash": "HashyHash2",
                "salt": "saltySalt2",
                "groups": ["Group3@LOCAL"],
                "configurationAttributes": []
            }, {
                "login_name": "User3",
                "administrator": false,
                "pw_hash": "HashyHash3",
                "salt": "saltySalt3",
                "groups": [],
                "configurationAttributes": []
            }, {
                "login_name": "User4",
                "administrator": false,
                "pw_hash": "HashyHash4",
                "salt": "saltySalt4",
                "groups": [],
                "configurationAttributes": []
            }
        ]`);   
        let normalized = normalizeUsermanagement(usermanagement);
        expectEqualJson(normalized, expected, done);
    });
}