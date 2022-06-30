export const configAttr = `
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
ORDER BY jt.id;
`;

export const domains = 'SELECT name AS domainname FROM cs_domain ORDER BY id;';

export const policyRules = `
SELECT cs_policy.name AS policy, cs_permission.key AS permission, default_value AS default_value
FROM cs_policy_rule, cs_policy, cs_permission 
WHERE 
    cs_policy_rule.policy = cs_policy.id 
    and cs_policy_rule.permission = cs_permission.id
ORDER BY cs_policy_rule.id;
`;

export const users = ` 
SELECT login_name, last_pwd_change, administrator, trim(pw_hash) AS pw_hash, trim(salt) AS salt
FROM cs_usr
ORDER BY id;
`;

export const usergroups = `
SELECT 
    cs_domain.name AS domain,
    cs_ug.name AS name, 
    cs_ug.descr AS descr
FROM cs_ug, cs_domain 
WHERE cs_ug.domain = cs_domain.id
ORDER BY cs_ug.id;
`;

export const usergroupmembership = ` 
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
ORDER BY id; 
`;

export const classes = `
SELECT 
    c.table_name "table", c.name,c.descr,c.primary_key_field pk,c.indexed,
    ci.file_name "classIcon", oi.file_name "objectIcon", null as icon,
    jcs.type toStringType, jcs.qualifier toStringClass,
    jce.type editorType, jce.qualifier editorClass,
    jcr.type rendererType, jcr.qualifier rendererClass,
    c.array_link,
    cp.name "policy", ap.name attribute_policy
FROM 
    cs_class c 
    LEFT OUTER JOIN cs_icon ci ON (c.class_icon_id=ci.id)
    LEFT OUTER JOIN cs_icon oi ON (c.object_icon_id=oi.id)
    LEFT OUTER JOIN cs_java_class jcs on (c.tostring=jcs.id)
    LEFT OUTER JOIN cs_java_class jce on (c.editor=jce.id)
    LEFT OUTER JOIN cs_java_class jcr on (c.renderer=jcr.id)
    LEFT OUTER JOIN cs_policy cp on (c.policy=cp.id)
    LEFT OUTER JOIN cs_policy ap on (c.attribute_policy=ap.id)
ORDER BY c.id;
`;

export const attributes = `
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
    c.table_name, a.pos;
`;

export const classAttributes = `
SELECT cs_class.table_name AS table, attr_key AS key, attr_value AS value 
FROM cs_class_attr
JOIN cs_class ON (cs_class.id = cs_class_attr.class_id)
ORDER BY cs_class_attr.id;
`;

export const classPermissions = `
SELECT
    cs_domain.name AS domain, cs_ug.name AS group, cs_class.table_name AS table, cs_permission.key AS permission
FROM
    cs_ug_class_perm
    JOIN cs_permission ON (cs_permission.id = cs_ug_class_perm.permission)
    JOIN cs_class ON (cs_ug_class_perm.class_id = cs_class.id)
    JOIN cs_ug ON (cs_ug_class_perm.ug_id = cs_ug.id)
    JOIN cs_domain ON (cs_ug.domain = cs_domain.id)
ORDER BY cs_ug_class_perm.id;
`;

export const attributePermissions = `
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
`;

export const nodes = `
SELECT 
    node.id, 
    node.name, 
    node.url AS descr, 
    class.table_name AS table, 
    node.derive_permissions_from_class, 
    node.object_id, 
    node.node_type, 
    node.is_root, 
    node.org, 
    node.dynamic_children, 
    node.dynamic_children_filename,
    node.sql_sort, 
    policy.name AS policy, 
    node.iconfactory, 
    node.icon, 
    node.artificial_id
FROM
    cs_cat_node AS node
    LEFT OUTER JOIN cs_class AS class ON node.class_id = class.id
    LEFT OUTER JOIN cs_policy AS policy ON node.policy = policy.id
ORDER BY node.id
`;

export const dynchildhelpers = `
SELECT id, name, code, filename
FROM cs_dynamic_children_helper
ORDER BY id    
`;

export const links = `
SELECT 
    id_from, id_to, org 
FROM 
    cs_cat_link
;`;

export const nodePermissions = `
SELECT 
    d.name "domain", g.name "group", cnp.cat_node_id, p."key" "permission"
FROM 
    cs_ug_cat_node_perm cnp
    JOIN cs_permission p ON (p.id=cnp.permission)
    JOIN cs_ug g ON (cnp.ug_id=g.id)
    JOIN cs_domain d ON (g.domain=d.id)
ORDER BY g.name, d.name, p.key;
`;