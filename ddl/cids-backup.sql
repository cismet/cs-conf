CREATE OR REPLACE FUNCTION public.cs_dump_cs_tables(tabs TEXT[]
    )
    RETURNS SETOF TEXT 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
    ROWS 1000
    
AS $BODY$
declare
    ref record;
    rec record;
    cols TEXT[];
    result TEXT;
    selectStatement TEXT;
    cur refcursor;
    kap TEXT;
    ind INTEGER;
    dTypes TEXT[];
begin
    result = '';
    
    for ref in SELECT 'ALTER TABLE ' || tc.table_schema || '.' ||  tc.table_name || ' DROP CONSTRAINT ' || tc.constraint_name || ';' as st
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = any (tabs) and ccu.table_schema = 'public' loop
         return next ref.st;
    end loop;
    for ref in  SELECT * FROM pg_catalog.pg_tables WHERE schemaname = 'public' and tablename = any (tabs) loop
        result = 'DELETE FROM ' || ref.tablename || ';';
        return next result;
        result = '';
        SELECT array_agg(column_name::TEXT), array_agg(data_type::TEXT) into cols, dTypes FROM information_schema.columns WHERE table_schema = 'public' and table_name = ref.tablename;
        selectStatement = 'SELECT ' || array_to_string(cols, ',') || ' from ' || ref.tablename;
        if cols is null then
            raise notice 'cols = null for table %', ref.tablename;
            continue;
        end if;
        
        for rec in execute selectStatement loop
            result = 'insert into ' || ref.tablename || ' (' || array_to_string(cols, ',') || ')' || ' values ('; 
            for ind in array_lower(cols, 1)..array_upper(cols, 1) loop
                execute 'SELECT ($1::text::' || ref.tablename || ').' || cols[ind] INTO kap USING rec;
                
                if ind > 1 then
                    result = result || ',';
                end if;
                
                if (dTypes[ind] ilike '%char%' or dTypes[ind] ilike '%text%'  or dTypes[ind] ilike '%time%'  or dTypes[ind] ilike '%date%') then
                    result = result || format('%L', kap);
                else result = result || coalesce(kap, 'null');
                end if;
            end loop;
            
            result = result || ');';-- || E'\n';
            return next result;
            result = '';
        end loop;
    end loop;
    
    for ref in SELECT 'ALTER TABLE ' || tc.table_schema || '.' ||  tc.table_name || ' ADD CONSTRAINT ' || tc.constraint_name 
            || ' ' || pg_catalog.pg_get_constraintdef(co.oid, true) || ';' as st
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN pg_catalog.pg_namespace as na
              ON na.nspname = ccu.table_schema
            JOIN pg_catalog.pg_constraint AS co
              ON co.connamespace = na.oid
              AND co.conname = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = any (tabs) and ccu.table_schema = 'public' loop
         return next ref.st;
    end loop;
    
    return;
end
$BODY$;