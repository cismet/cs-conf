INSERT INTO cs_history (usr_id, ug_id, class_id, object_id, valid_from, json_data) (
  SELECT 
    cs_usr.id AS usr_id,
    cs_ug.id AS ug_id,
    cs_class.id AS class_id,
    cs_history_before_import.object_id,
    cs_history_before_import.valid_from,
    cs_history_before_import.json_data
  FROM cs_history_before_import 
  LEFT JOIN cs_usr ON cs_history_before_import.usr_key = cs_usr.login_name
  LEFT JOIN cs_ug ON cs_history_before_import.ug_key = cs_ug.name
  LEFT JOIN cs_class ON cs_history_before_import.class_key = cs_class.table_name
);

DROP TABLE cs_history_before_import;