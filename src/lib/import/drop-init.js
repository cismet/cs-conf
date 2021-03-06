const sql = `
DROP TABLE IF EXISTS  cs_attr CASCADE;
DROP SEQUENCE IF EXISTS  cs_cat_link_sequence CASCADE;
DROP TABLE IF EXISTS cs_cat_link CASCADE;
DROP TABLE IF EXISTS cs_cat_node CASCADE;
DROP TABLE IF EXISTS cs_dynamic_children_helper CASCADE;
DROP SEQUENCE IF EXISTS  cs_dynamic_children_helper_sequence CASCADE;
DROP TABLE IF EXISTS cs_class CASCADE;
DROP SEQUENCE IF EXISTS  cs_class_attr_sequence CASCADE;
DROP TABLE IF EXISTS cs_class_attr CASCADE;
DROP SEQUENCE IF EXISTS  cs_domain_sequence CASCADE;
DROP TABLE IF EXISTS cs_domain CASCADE;
DROP SEQUENCE IF EXISTS  cs_icon_sequence CASCADE;
DROP TABLE IF EXISTS cs_icon CASCADE;
DROP SEQUENCE IF EXISTS  cs_java_class_sequence CASCADE;
DROP TABLE IF EXISTS cs_java_class CASCADE;
DROP SEQUENCE IF EXISTS  cs_permission_sequence CASCADE;
DROP TABLE IF EXISTS cs_permission CASCADE;
DROP SEQUENCE IF EXISTS  cs_policy_sequence CASCADE;
DROP TABLE IF EXISTS cs_policy CASCADE;
DROP SEQUENCE IF EXISTS  cs_policy_rule_sequence CASCADE;
DROP TABLE IF EXISTS cs_policy_rule CASCADE;
DROP TABLE IF EXISTS cs_type CASCADE;
DROP SEQUENCE IF EXISTS  cs_ug_sequence CASCADE;
DROP TABLE IF EXISTS cs_ug CASCADE;
DROP TABLE IF EXISTS cs_ug_attr_perm CASCADE;
DROP TABLE IF EXISTS cs_ug_cat_node_perm CASCADE;
DROP SEQUENCE IF EXISTS  cs_ug_class_perm_sequence CASCADE;
DROP TABLE IF EXISTS cs_ug_class_perm CASCADE;
DROP SEQUENCE IF EXISTS  cs_ug_membership_sequence CASCADE;
DROP TABLE IF EXISTS cs_ug_membership  CASCADE;
DROP TABLE IF EXISTS  cs_usr CASCADE;
DROP SEQUENCE IF EXISTS  cs_attr_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_cat_node_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_class_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_type_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_ug_attr_perm_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_ug_cat_node_perm_sequence CASCADE;
DROP SEQUENCE IF EXISTS  cs_usr_sequence CASCADE;
DROP INDEX IF EXISTS  cl_idx CASCADE;
DROP INDEX IF EXISTS  ob_idx CASCADE;
DROP INDEX IF EXISTS  obj_cl_idx CASCADE;
DROP SEQUENCE IF EXISTS  cs_config_attr_key_sequence CASCADE;
DROP TABLE IF EXISTS  cs_config_attr_key CASCADE;
DROP SEQUENCE IF EXISTS  cs_config_attr_value_sequence CASCADE;
DROP TABLE IF EXISTS  cs_config_attr_value  CASCADE;
DROP SEQUENCE IF EXISTS  cs_config_attr_type_sequence CASCADE;
DROP TABLE IF EXISTS  cs_config_attr_type  CASCADE;
DROP SEQUENCE IF EXISTS  cs_config_attr_jt_sequence CASCADE;
DROP TABLE IF EXISTS  cs_config_attr_jt CASCADE;
DROP SEQUENCE IF EXISTS  cs_config_attr_exempt_sequence CASCADE;
DROP TABLE IF EXISTS  cs_config_attr_exempt  CASCADE;
DROP SEQUENCE IF EXISTS  cs_scheduled_serveractions_sequence CASCADE;
DROP TABLE IF EXISTS  cs_scheduled_serveractions  CASCADE;
`;

export default sql;