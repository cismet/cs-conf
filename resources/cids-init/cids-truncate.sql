--TRUNCATE TABLE cs_attr CASCADE;
DELETE FROM cs_attr;
ALTER SEQUENCE cs_attr_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_cat_link CASCADE;
DELETE FROM cs_cat_link;
ALTER SEQUENCE cs_cat_link_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_history CASCADE;
SELECT 
    cs_usr.login_name AS usr_key,
    cs_ug.name AS ug_key,
    cs_class.table_name AS class_key,
    cs_history.usr_id,
    cs_history.ug_id,
    cs_history.class_id,
    cs_history.object_id,
    cs_history.valid_from,
    cs_history.json_data
INTO cs_history_before_import2
FROM cs_history 
LEFT JOIN cs_usr ON cs_history.usr_id = cs_usr.id
LEFT JOIN cs_ug ON cs_history.ug_id = cs_ug.id
LEFT JOIN cs_class ON cs_history.class_id = cs_class.id;
DROP TABLE cs_history_before_import2;
DELETE FROM cs_history;
--ALTER SEQUENCE cs_history_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_class CASCADE;
DELETE FROM cs_class;
ALTER SEQUENCE cs_class_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_class_attr CASCADE;
DELETE FROM cs_class_attr;
ALTER SEQUENCE cs_attr_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_jt CASCADE;
DELETE FROM cs_config_attr_jt;
ALTER SEQUENCE cs_config_attr_jt_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_key CASCADE;
DELETE FROM cs_config_attr_key;
ALTER SEQUENCE cs_config_attr_key_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_value CASCADE;
DELETE FROM cs_config_attr_value;
ALTER SEQUENCE cs_config_attr_value_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_domain CASCADE;
DELETE FROM cs_domain;
ALTER SEQUENCE cs_domain_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_dynamic_children_helper CASCADE;
DELETE FROM cs_dynamic_children_helper;
ALTER SEQUENCE cs_dynamic_children_helper_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_icon CASCADE;
DELETE FROM cs_icon;
ALTER SEQUENCE cs_icon_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_java_class CASCADE;
DELETE FROM cs_java_class;
ALTER SEQUENCE cs_java_class_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_policy_rule CASCADE;
DELETE FROM cs_policy_rule;
ALTER SEQUENCE cs_policy_rule_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_type CASCADE;
DELETE FROM cs_type;
ALTER SEQUENCE cs_type_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_ug CASCADE;
DELETE FROM cs_ug;
ALTER SEQUENCE cs_ug_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_ug_class_perm CASCADE;
DELETE FROM cs_ug_class_perm;
ALTER SEQUENCE cs_ug_class_perm_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_ug_membership CASCADE;
DELETE FROM cs_ug_membership;
ALTER SEQUENCE cs_ug_membership_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_usr CASCADE; 
DELETE FROM cs_usr;
ALTER SEQUENCE cs_usr_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_cat_node CASCADE; 
DELETE FROM cs_cat_node;
ALTER SEQUENCE cs_cat_node_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_exempt CASCADE; 
DELETE FROM cs_config_attr_exempt;
ALTER SEQUENCE cs_config_attr_exempt_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_ug_attr_perm CASCADE; 
DELETE FROM cs_ug_attr_perm;
ALTER SEQUENCE cs_ug_attr_perm_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_ug_cat_node_perm CASCADE; 
DELETE FROM cs_ug_cat_node_perm;
ALTER SEQUENCE cs_ug_cat_node_perm_sequence RESTART WITH 1;