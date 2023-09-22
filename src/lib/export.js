import util from 'util';

import exportConfigAttributes from './export/configAttributes';
import exportDomains from './export/domains';
import exportPolicyRules from './export/policyRules';
import exportUserManagement from './export/usermanagement';
import exportClasses from './export/classes';
import exportClassPermissions from './export/classPermissions.js';
import exportAttrPermissions from './export/attrPermissions.js';
import exportStructure from './export/structure.js';
import { writeConfigFiles } from './tools/configFiles';
import { simplifyConfigs } from './simplify';
import { reorganizeConfigs } from './reorganize';
import { logOut, logVerbose } from './tools/tools';
import { initClient } from './tools/db';
import { getClientInfo } from './tools/db';
import normalizeConfig from './normalize/config';
import exportDynchildhelpers from './export/dynchildhelpers';
import exportUsergroups from './export/usergroups';

async function csExport(options) {
    let  { targetDir, normalized = false } = options;

    let fetchedData = await fetch();
    let configs = exportConfigs(fetchedData, global.config);

    configs = reorganizeConfigs(configs);

    if (!normalized) {
        configs = simplifyConfigs(configs);
    }

    let configsDir = targetDir != null ? targetDir : normalizeConfig(configs.config).configsDir;
    writeConfigFiles(configs, configsDir);
}

async function fetch() {
    let client = await initClient(global.config.connection);

    logOut(util.format("Fetching cs Data from '%s' ...", getClientInfo()));
    let fetchedData = {};

    logVerbose(" ↳ fetching cs_policy_rules");
    fetchedData['csPolicyRules'] = (await client.query(policyRulesExportStatement)).rows;

    logVerbose(" ↳ fetching cs_config_attr_*");
    fetchedData['csConfigAttrs'] = (await client.query(configAttrExportStatement)).rows;

    logVerbose(" ↳ fetching cs_domains");
    fetchedData['csDomains'] = (await client.query(domainsExportStatement)).rows;

    logVerbose(" ↳ fetching cs_ug");
    fetchedData['csUgs'] = (await client.query(usergroupsExportStatement)).rows;

    logVerbose(" ↳ fetching cs_usr");
    fetchedData['csUsrs'] = (await client.query(usersExportStatement)).rows;

    logVerbose(" ↳ fetching cs_ug_membership");
    fetchedData['csUgMemberships'] = (await client.query(usergroupmembershipExportStatement)).rows;

    logVerbose(" ↳ fetching cs_class");
    fetchedData['csClasses'] = (await client.query(classesExportStatement)).rows;

    logVerbose(" ↳ fetching cs_class_attr");
    fetchedData['csClassAttrs'] = (await client.query(classAttributesExportStatement)).rows;

    logVerbose(" ↳ fetching cs_ug_class_perm");
    fetchedData['csUgClassPerms'] = (await client.query(classPermissionsExportStatement)).rows;

    logVerbose(" ↳ fetching cs_attr");
    fetchedData['csAttrs'] = (await client.query(attributesExportStatement)).rows;

    logVerbose(" ↳ fetching cs_ug_attr_perm");
    fetchedData['csUgAttrPerms'] = (await client.query(attributePermissionsExportStatement)).rows;

    logVerbose(" ↳ fetching cs_cat_node");
    fetchedData['csCatNodes'] = (await client.query(nodesExportStatement)).rows;

    logVerbose(" ↳ fetching cs_cat_link");
    fetchedData['csCatLinks'] = (await client.query(linksExportStatement)).rows;

    logVerbose(" ↳ fetching cs_ug_cat_node_perm");
    fetchedData['csUgCatNodePerms'] = (await client.query(nodePermissionsExportStatement)).rows;

    logVerbose(" ↳ fetching cs_dynamic_children_helper");
    fetchedData['csDynamicChildreHelpers'] = (await client.query(dynchildhelpersExportStatement)).rows;

    return fetchedData;
}

function exportConfigs(fetchedData, config) {
    logOut(util.format("Exporting configuration from '%s' ...", getClientInfo()));
    let configs = { config };

    logVerbose(" ↳ creating configurationAttributes.json and xml-config-attrs files");
    Object.assign(configs, exportConfigAttributes(fetchedData, configs));

    logVerbose(" ↳ creating domains.json");
    Object.assign(configs, exportDomains(fetchedData, configs));

    logVerbose(" ↳ creating policyRules.json");
    Object.assign(configs, exportPolicyRules(fetchedData, configs));

    logVerbose(" ↳ creating usergroups.json");
    Object.assign(configs, exportUsergroups(fetchedData, configs));

    logVerbose(" ↳ creating usermanagement.json");
    Object.assign(configs, exportUserManagement(fetchedData, configs));

    logVerbose(" ↳ creating classes.json");
    Object.assign(configs, exportClasses(fetchedData, configs));

    logVerbose(" ↳ creating classPerms.json");
    Object.assign(configs, exportClassPermissions(fetchedData, configs));
    
    logVerbose(" ↳ creating attrPerms.json");
    Object.assign(configs, exportAttrPermissions(fetchedData, configs));

    logVerbose(" ↳ creating dynchildhelpers.json and structure-helper-stmnts files");
    Object.assign(configs, exportDynchildhelpers(fetchedData, configs));

    logVerbose(" ↳ creating structure.json and structure-dyn-children-stmnts files");
    Object.assign(configs, exportStructure(fetchedData, configs));

    return configs;
}

const configAttrExportStatement = `
SELECT 
    usr.login_name,
    domain.name AS domainname,
    ug.name || '@' || ug_domain.name AS groupkey,
    key.key,
    key.group_name AS keygroup,
    type.type,
    value.value,
    value.filename
FROM 
    cs_config_attr_jt AS jt
    INNER JOIN cs_config_attr_key key ON jt.key_id = key.id
    INNER JOIN cs_config_attr_type type ON jt.type_id = type.id
    INNER JOIN cs_config_attr_value value ON jt.val_id = value.id
    LEFT OUTER JOIN cs_domain AS domain ON jt.dom_id = domain.id
    LEFT OUTER JOIN cs_usr AS usr ON jt.usr_id = usr.id
    LEFT OUTER JOIN cs_ug AS ug ON jt.ug_id = ug.id
    LEFT OUTER JOIN cs_domain AS ug_domain ON ug.domain = ug_domain.id
ORDER BY jt.id
;`;

const domainsExportStatement = 'SELECT name AS domainname FROM cs_domain ORDER BY id;';

const policyRulesExportStatement = `
SELECT cs_policy.name AS policy, cs_permission.key AS permission, default_value AS default_value
FROM cs_policy_rule, cs_policy, cs_permission 
WHERE 
    cs_policy_rule.policy = cs_policy.id 
    and cs_policy_rule.permission = cs_permission.id
ORDER BY cs_policy_rule.id;
`;

const usersExportStatement = ` 
SELECT 
    login_name, 
    TO_CHAR(last_pwd_change, 'DD.MM.YYYY, HH24:MI:SS') AS last_pwd_change, 
    trim(pw_hash) AS pw_hash, 
    trim(salt) AS salt
FROM cs_usr
ORDER BY id
;`;

const usergroupsExportStatement = `
SELECT 
    cs_domain.name AS domain,
    cs_ug.name AS name, 
    cs_ug.descr AS descr
FROM cs_ug, cs_domain 
WHERE cs_ug.domain = cs_domain.id
ORDER BY cs_ug.id
;`;

const usergroupmembershipExportStatement = ` 
SELECT login_name, domainname, groupname
FROM (
    SELECT min(cs_ug_membership.id) AS id, cs_usr.login_name AS login_name, cs_domain.name AS domainname, cs_ug.name AS groupname
    FROM 
        cs_ug_membership cs_ug_membership 
        INNER JOIN cs_usr ON (cs_ug_membership.usr_id = cs_usr.id)
        INNER JOIN cs_ug ON (cs_ug_membership.ug_id = cs_ug.id) 
        INNER JOIN cs_domain ON (cs_domain.id = cs_ug.domain)
    GROUP BY cs_usr.login_name, cs_domain.name, cs_ug.name
) AS sub
ORDER BY id
;`;

const classesExportStatement = `
SELECT 
    c.table_name AS "table", 
    c.name AS "name",
    c.descr AS "descr",
    c.primary_key_field AS "pk",
    c.indexed AS "indexed",
    ci.file_name AS "classIcon", 
    oi.file_name AS "objectIcon", 
    null AS "icon",
    jcs.type AS "toStringType", 
    jcs.qualifier AS "toStringClass",
    jce.type AS "editorType", 
    jce.qualifier AS "editorClass",
    jcr.type AS "rendererType", 
    jcr.qualifier AS "rendererClass",
    c.array_link AS "array_link",
    cp.name AS "policy", 
    ap.name AS "attribute_policy",
    c.pos_attr AS "attributesOrder",
    cs_id.used_id AS "enforcedId",
    cs_id.reason AS "enforcedIdReason"
FROM 
    cs_class c 
    LEFT OUTER JOIN cs_id ON (cs_id.type='cs_class' AND cs_id.enforced_id IS TRUE AND cs_id.key=c.table_name)
    LEFT OUTER JOIN cs_icon ci ON (c.class_icon_id=ci.id)
    LEFT OUTER JOIN cs_icon oi ON (c.object_icon_id=oi.id)
    LEFT OUTER JOIN cs_java_class jcs on (c.tostring=jcs.id)
    LEFT OUTER JOIN cs_java_class jce on (c.editor=jce.id)
    LEFT OUTER JOIN cs_java_class jcr on (c.renderer=jcr.id)
    LEFT OUTER JOIN cs_policy cp on (c.policy=cp.id)
    LEFT OUTER JOIN cs_policy ap on (c.attribute_policy=ap.id)
ORDER BY c.id
;`;

const attributesExportStatement = `
SELECT 
    a.field_name field, a.name, c.table_name "table" ,a.descr,
    t.name "dbType",tc.table_name "cidsType",tc.table_name "oneToMany", tc.table_name "manyToMany", a.precision, a.scale, a.extension_attr, NOT a.optional mandatory, a.default_value "defaultValue",
    a.foreign_key, a.foreign_key_references_to "foreignKeyTableId", fkc.table_name foreignkeytable, a.substitute,
    NOT a.visible hidden, a.indexed,
    a.isarray "isArrray", a.array_key "arrayKey"
FROM 
    cs_attr a
    LEFT OUTER JOIN cs_class c ON (a.class_id=c.id)
    LEFT OUTER JOIN cs_type t ON (a.type_id=t.id)
    LEFT OUTER JOIN cs_class tc ON (t.class_id=tc.id)
    LEFT OUTER JOIN cs_class fkc ON (a.foreign_key_references_to=fkc.id)
ORDER BY
    c.table_name, a.pos
;`;

const classAttributesExportStatement = `
SELECT cs_class.table_name AS table, attr_key AS key, attr_value AS value 
FROM cs_class_attr
JOIN cs_class ON (cs_class.id = cs_class_attr.class_id)
ORDER BY cs_class_attr.id
;`;

const classPermissionsExportStatement = `
SELECT
    cs_domain.name AS domain, cs_ug.name AS group, cs_class.table_name AS table, cs_permission.key AS permission
FROM
    cs_ug_class_perm
    JOIN cs_permission ON (cs_permission.id = cs_ug_class_perm.permission)
    JOIN cs_class ON (cs_ug_class_perm.class_id = cs_class.id)
    JOIN cs_ug ON (cs_ug_class_perm.ug_id = cs_ug.id)
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
ORDER BY cs_ug_class_perm.id
;`;

const attributePermissionsExportStatement = `
SELECT
    cs_domain.name AS domain, cs_ug.name AS group, cs_class.table_name AS table, cs_attr.field_name AS field, cs_permission.key AS permission
FROM
    cs_ug_attr_perm 
    JOIN cs_permission ON (cs_permission.id = cs_ug_attr_perm.permission)
    JOIN cs_attr ON (cs_ug_attr_perm.attr_id = cs_attr.id)
    JOIN cs_class ON (cs_attr.class_id = cs_class.id)
    JOIN cs_ug ON (cs_ug_attr_perm.ug_id = cs_ug.id)
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
ORDER BY cs_ug_attr_perm.id
;`;

const nodesExportStatement = `
SELECT 
    node.id, 
    node.name, 
    class.table_name AS table, 
    node.derive_permissions_from_class, 
    node.object_id, 
    node.node_type, 
    node.is_root, 
    node.org, 
    CASE WHEN url.id IS NOT NULL THEN url_base.prot_prefix || url_base.server || url_base.path || url.object_name ELSE node.url END AS url,
    node.dynamic_children, 
    node.dynamic_children_filename,
    node.sql_sort, 
    policy.name AS policy, 
    node.iconfactory, 
    node.icon, 
    node.artificial_id
FROM
    cs_cat_node AS node
    LEFT OUTER JOIN url ON (node.descr = url.id) 
    LEFT OUTER JOIN url_base ON (url.url_base_id = url_base.id) 
    LEFT OUTER JOIN cs_class AS class ON node.class_id = class.id
    LEFT OUTER JOIN cs_policy AS policy ON node.policy = policy.id
ORDER BY node.id
;`;

const dynchildhelpersExportStatement = `
SELECT id, name, code, filename
FROM cs_dynamic_children_helper
ORDER BY id    
;`;

const linksExportStatement = `
SELECT 
    id_from, id_to, org 
FROM 
    cs_cat_link
;`;

const nodePermissionsExportStatement = `
SELECT 
    d.name "domain", g.name "group", cnp.cat_node_id, p."key" "permission"
FROM 
    cs_ug_cat_node_perm cnp
    JOIN cs_permission p ON (p.id=cnp.permission)
    JOIN cs_ug g ON (cnp.ug_id=g.id)
    JOIN cs_domain d ON (g.domain=d.id)
ORDER BY g.name, d.name, p.key
;`;

export default csExport;