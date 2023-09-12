--TRUNCATE TABLE cs_config_attr_jt CASCADE;
DELETE FROM cs_config_attr_jt;
ALTER SEQUENCE cs_config_attr_jt_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_key CASCADE;
DELETE FROM cs_config_attr_key;
ALTER SEQUENCE cs_config_attr_key_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_value CASCADE;
DELETE FROM cs_config_attr_value;
ALTER SEQUENCE cs_config_attr_value_sequence RESTART WITH 1;

--TRUNCATE TABLE cs_config_attr_exempt CASCADE; 
DELETE FROM cs_config_attr_exempt;
ALTER SEQUENCE cs_config_attr_exempt_sequence RESTART WITH 1;
