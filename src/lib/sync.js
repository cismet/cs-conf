import fs from 'fs';
import util from 'util';
import wcmatch from 'wildcard-match';
import csExport from './export';
import { logDebug, logInfo, logOut, logVerbose, logWarn } from './tools/tools';
import { initClient } from './tools/db';
import { readConfigFiles } from './tools/configFiles';
import { normalizeConfigs } from './normalize';
import stringify from 'json-stringify-pretty-compact';

async function createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, clazz, noDropColumns, dropColumns) {
    let statements = [];
    let cidsTableName = clazz.table.toLowerCase();

    if (!tablesDone.includes(cidsTableName) && !existingData.ignoredTables.includes(cidsTableName)) {
        tablesDone.push(cidsTableName);

        let pk = clazz.pk;

        if (!existingData.tables.hasOwnProperty(cidsTableName)) {

            // table not yet existing => creating

            let sequenceName = util.format("%s_seq", cidsTableName);
            let columns = [];

            if (clazz.attributes) {
                for (let cidsAttribute of clazz.attributes) {
                    let fieldName = cidsAttribute.field;
                    if (!(cidsAttribute.extension_attr || cidsAttribute.oneToMany)) {

                        // skipping extension- and 1-n- attributes
                        if (cidsAttribute.cidsType) {
                            
                            // foreign key => recursion 

                            let subCidsTableName = cidsAttribute.cidsType;
                            let subCidsClass = allCidsClassesByTableName[subCidsTableName];
                            // directly adding recursive results to statements-array for assuring
                            // that the most bottom table is created first
                            statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, subCidsClass, noDropColumns, dropColumns));
                            
                            columns.push({ name: fieldName, type: "integer", null: !cidsAttribute.mandatory });
                        } else {

                            if (cidsAttribute.manyToMany) {
                                    // array attribute => adding mandatory integer column
                                columns.push({ name: fieldName, type: "integer", primary: false, null: false });
                            } else {
                                // primitive attribute => adding column with attributes
                                columns.push({ name: fieldName, type: fullTypeFromAttribute(cidsAttribute), primary: fieldName == pk, null: !cidsAttribute.mandatory, default: cidsAttribute.defaultValue});
                            }

                            /*if (fieldName == pk) {
                                // no need to create a pk anymore, it was explicitly defined
                                pk = null;
                            }*/
                        }
                    } 
                } 
                /*if (pk) { 
                    // adding primary key (at the beginning)
                    columns.unshift({ name: pk, type: "integer", null: false, default: util.format("nextval('%s')", sequenceName) })
                }*/

            }

            statements.push({ action: "CREATE TABLE", table: cidsTableName, columns: columns, sequence: !existingData.sequences.includes(sequenceName) });

        } else {

            // table already existing => altering
            let existingTable = existingData.tables[cidsTableName];

            if (existingTable.tableType.toUpperCase() === 'BASE TABLE') {

                // skipping views (f.e.)

                let pkFound = false;
                let columnsDone = [];
                if (clazz.attributes) {
                    for (let cidsAttribute of clazz.attributes) {
                        if (!(cidsAttribute.extension_attr || cidsAttribute.oneToMany)) {
                            let fieldName = cidsAttribute.field.toLowerCase();
                            columnsDone.push(fieldName);

                            // skipping extension- and 1-n- attributes
                            if (cidsAttribute.cidsType) {

                                // foreign key => recursion 

                                let subCidsTableName = cidsAttribute.cidsType;
                                let subCidsClass = allCidsClassesByTableName[subCidsTableName];
                                // directly adding recursive results to statements-array for assuring
                                // that the most bottom table is created first
                                statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, subCidsClass, noDropColumns, dropColumns));

                                if (!existingTable.columns.hasOwnProperty(fieldName)) {
                                    statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: "integer", null: !cidsAttribute.mandatory });
                                }

                            } else {

                                if (!existingTable.columns.hasOwnProperty(fieldName)) {
                                                                                   
                                    // column missing => adding                                
                                    if (cidsAttribute.manyToMany) {
                                        // array attribute => adding mandatory integer column
                                        statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: "integer", null: false });
                                    } else {
                                        let type = fullTypeFromAttribute(cidsAttribute);
                                        
                                        let defaultValue = (type && cidsAttribute.defaultValue && isTextType(type)) ? util.format("'%s'", cidsAttribute.defaultValue) : cidsAttribute.defaultValue;
                                        statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: fullTypeFromAttribute(cidsAttribute), null: !cidsAttribute.mandatory, default: defaultValue});
                                    }

                                } else {
                                    let existingColumn = existingTable.columns[fieldName];                                                                

                                    let oldType = { 
                                        dbType: existingColumn.dataType, 
                                        precision: existingColumn.precision, 
                                        scale: existingColumn.scale 
                                    };

                                    let statement = { 
                                        action: "CHANGE COLUMN", 
                                        table: cidsTableName, 
                                        column: fieldName, 
                                        primary : fieldName == pk, 
                                        oldType: fullTypeFromAttribute(oldType), 
                                        oldNull: existingColumn.isNullable, 
                                        oldDefault: existingColumn.default 
                                    };
                                                    
                                    if (fieldName == pk) {                
                                        pkFound = true;
                                    }

                                    // primitive column existing => altering if needed

                                    let cidsAttributeDbType = cidsAttribute.dbType != null ? cidsTypeToDb(cidsAttribute.dbType).toUpperCase() : null;
                                    let existingColumnDbType = existingColumn.dataType.toUpperCase();

                                    let precisionIsRelevant = 
                                        cidsAttributeDbType == "NUMERIC" ||
                                        cidsAttributeDbType == "VARCHAR" ||
                                        cidsAttributeDbType == "CHAR";
                                    let scaleIsRelevant = cidsAttributeDbType == "NUMERIC";
                                    let typeIdentical = (
                                            (cidsAttribute.manyToMany && existingColumnDbType === 'INT4')
                                            || cidsAttributeDbType == existingColumnDbType
                                        )                            
                                        && (cidsAttribute.precision == existingColumn.precision || !precisionIsRelevant)
                                        && (cidsAttribute.scale == existingColumn.scale || !scaleIsRelevant);

                                    if (!typeIdentical) {
                                        statement.type = fullTypeFromAttribute(cidsAttribute);
                                    }

                                    let mandatory = cidsAttribute.mandatory === true;
                                    if (mandatory == existingColumn.isNullable) {
                                        statement.null = !mandatory;
                                    }

                                    let normalizedDefaultValue = fieldName == pk && (existingColumn.default == util.format("nextval('%s_seq'::text)", cidsTableName) || existingColumn.default == util.format("nextval('%s_seq'::regclass)", cidsTableName)) ? util.format("nextval('%s_seq')", cidsTableName) : existingColumn.default;
                                    let isText = isTextType(existingColumn.dataType);
                                    let escapedExisting = cidsAttribute.defaultValue && isText ? normalizedDefaultValue : util.format("'%s'", normalizedDefaultValue);
                                    if (cidsAttribute.defaultValue !== undefined && escapedExisting != util.format("'%s'", cidsAttribute.defaultValue)) {
                                        statement.default = existingColumn.dataType && cidsAttribute.defaultValue && isText ? util.format("'%s'", cidsAttribute.defaultValue) : cidsAttribute.defaultValue;
                                    }

                                    // special treatment if mandatory and default value is set => update data
                                    if ((statement.null || statement.default) && cidsAttribute.mandatory && existingColumn.isNullable && cidsAttribute.defaultValue) {
                                        statement.update = true;
                                    }

                                    if (statement.type !== undefined || statement.null !== undefined || statement.default !== undefined || statement.update !== undefined) {
                                        if (statement.type === undefined) {
                                            delete statement.oldType;
                                        }
                                        if (statement.null === undefined) {
                                            delete statement.oldNull;
                                        }
                                        if (statement.default === undefined) {
                                            delete statement.oldDefault;
                                        }
                                        statements.push(statement);
                                    }
                                }          
                            }    
                        }
                    }
                }

                if (!pkFound) {
                    // primary key => fixed attributes

                    let existingColumn = existingTable.columns[pk];                            

                    if (existingColumn) {
                        let oldType = { 
                            dbType: existingColumn.dataType, 
                            precision: existingColumn.precision, 
                            scale: existingColumn.scale 
                        };

                        let statement = { action: "CHANGE COLUMN", table: cidsTableName, column: pk, primary : true, oldType: fullTypeFromAttribute(oldType), oldNull: existingColumn.isNullable, oldDefault: existingColumn.default };

                        if (existingColumn.isNullable) {
                            statement.oldNull = existingColumn.isNullable;
                        }
                        if (existingColumn.defaultValue) {
                            statement.oldDefault = existingColumn.defaultValue;
                        }

                        if (existingColumn.isNullable) {
                            statement.null = false;
                        }
                        if(existingColumn.default != util.format("nextval('%s_seq'::text)", cidsTableName) && existingColumn.default != util.format("nextval('%s_seq'::regclass)", cidsTableName)) {
                            statement.default = util.format("nextval('%s_seq')", cidsTableName);
                        }
                        if (statement.type !== undefined || statement.null !== undefined || statement.default !== undefined || statement.update !== undefined) {
                            statements.push(statement);
                        }                                        

                        // dont drop the pk column
                        columnsDone.push(pk);
                    }
                }

                for (let columnDone of columnsDone) {
                    delete existingTable.columns[columnDone];
                }
                Object.keys(existingTable.columns).forEach(function(key) {
                    let tableColumnKey = util.format("%s.%s", cidsTableName, key);
                    if (!noDropColumns.includes(tableColumnKey)) {
                        statements.push({ action: "DROP COLUMN", table: cidsTableName, column: key });
                        dropColumns.push(tableColumnKey);
                    }
                });        
            }
        }
    }
    return statements;
}

function isTextType(type) {
    return type.toLowerCase() === "text" || type.toLowerCase().startsWith("char") || type.toLowerCase().startsWith("varchar");
}

function cidsTypeToDb(type) {
    if (type != null) {
        switch(type.toUpperCase()) {
            case "CHAR": return "bpchar";
            case "INTEGER": return "int4";
            case "CIDS_GEOMETRY": return "geometry";
            default: return type.toLowerCase();
        }
    } else {
        return null;
    }
}

function fullTypeFromAttribute(cidsAttribute) {
    let fullType = cidsTypeToDb(cidsAttribute.dbType);
    if (fullType === "numeric" && cidsAttribute.precision) {
        fullType += util.format("(%s", cidsAttribute.precision);
        if (cidsAttribute.scale) {
            fullType += util.format(", %s", cidsAttribute.scale);
        }
        fullType += ")";
    } else if (fullType === "bpchar" && cidsAttribute.precision) {
        fullType += util.format("(%s)", cidsAttribute.precision);
    } else if (fullType === "varchar" && cidsAttribute.precision) {
        fullType += util.format("(%s)", cidsAttribute.precision);
    }    
    return fullType;
}

function queriesFromStatement(statement) {
    let queries = [];

    switch(statement.action) {
        case "DROP TABLE": {
            queries.push(util.format("DROP TABLE %s;", statement.table));
            if (statement.sequence) {
                queries.push(util.format("DROP SEQUENCE %s_seq;", statement.table));
            }
        } break;
        case "CREATE TABLE": {
            let sequenceName = util.format("%s_seq", statement.table);
            queries.push(util.format("-- creating table %s", statement.table));

            if (statement.sequence !== undefined) {
                queries.push(util.format("CREATE SEQUENCE %s INCREMENT BY 1 NO MAXVALUE NO MINVALUE;", sequenceName));
            }
            let columnSnippets = [];
            for (let column of statement.columns) {
                let snippet = util.format("\n  %s %s", column.name, column.type.toLowerCase());
                if (column.primary) {
                    snippet += " PRIMARY KEY";
                } else if (column.null !== undefined) {
                    if (column.null) {
                        snippet += " NULL";                    
                    } else {
                        snippet += " NOT NULL";
                    }
                }
                if (column.default !== undefined) {
                    if (isTextType(column.type)) {
                        snippet += util.format(" DEFAULT '%s'", column.default);
                    } else {
                        snippet += util.format(" DEFAULT %s", column.default);
                    }
                }        
                columnSnippets.push(snippet);
            }

            // joining column-snippets and adding tmp-statements to the statements
            if (columnSnippets.length > 0) {
                queries.push(util.format("CREATE TABLE %s (%s\n);", statement.table, columnSnippets.join(", ")));
            } else {
                queries.push(util.format("CREATE TABLE %s;", statement.table));
            }
        } break;
        case "DROP SEQUENCE": {
            let sequenceName = util.format("%s_seq", statement.table);
            queries.push(util.format("DROP SEQUENCE %s;",sequenceName));
        } break;
        case "ADD COLUMN": {
            let sequenceName = util.format("%s_seq", statement.table);

            let typeAndAttributes = statement.type;
            if (statement.primary) {
                typeAndAttributes += " PRIMARY KEY";
            } else if (statement.null) {
                typeAndAttributes += " NULL"
            } else {
                typeAndAttributes += " NOT NULL"
            }

            if (statement.default !== undefined) {
                typeAndAttributes += util.format(" DEFAULT %s", statement.default);
            }

            if (statement.sequence !== undefined) {
                queries.push(util.format("CREATE SEQUENCE %s INCREMENT BY 1 NO MAXVALUE NO MINVALUE;", sequenceName));
            }

            queries.push(util.format("-- adding column %s to table %s", statement.column, statement.table));
            queries.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", statement.table, statement.column, typeAndAttributes));
        } break;
        case "CHANGE COLUMN": {
            let tmpColumn = util.format("%s_%d", statement.column, Date.now());

            queries.push(util.format("-- changing column %s.%s", statement.table, statement.column));
            if (statement.type !== undefined) {
                queries.push(util.format("-- + changing type from %s to %s", statement.oldType, statement.type));
                /*
                queries.push(util.format("ALTER TABLE %s RENAME COLUMN %s TO %s;", statement.table, statement.column, tmpColumn));
                // ["\nBEGIN TRANSACTION;", ...queries, dryRun ? "-- because of dry-run\nROLLBACK TRANSACTION;" : "COMMIT TRANSACTION;" ]    

                let typeAndAttributes = statement.type;
                if (statement.null !== undefined) {
                    typeAndAttributes += " NULL"
                } else {
                    typeAndAttributes += " NOT NULL"
                }
                if (statement.default !== undefined) {
                    typeAndAttributes += util.format(" DEFAULT %s", statement.default);
                }
                queries.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", statement.table, statement.column, typeAndAttributes));
                queries.push(util.format("UPDATE %s SET %s = %s;", statement.table, statement.column, tmpColumn));
                queries.push(util.format("ALTER TABLE %s DROP COLUMN %s;", statement.table, tmpColumn));
                */
                queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s TYPE %s;", statement.table, statement.column, statement.type));
            }
            if (statement.update !== undefined) {
                queries.push(util.format("UPDATE TABLE %s SET %s = '%s' WHERE %s IS NULL;", statement.table, statement.column, statement.defaultValue, statement.column));
                if (statement.default == null) {                
                    queries.push("-- > WARNING, no default value for mandatory field. this may fail !")
                }
            }

            if (statement.default !== undefined) {
                if (statement.default == null) {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s DROP DEFAULT;", statement.table, statement.column));    
                } else {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT %s;", statement.table, statement.column, statement.default));    
                }
            }
            if (statement.null !== undefined) {
                if (statement.null) {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s DROP NOT NULL;", statement.table, statement.column));
                } else {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL;", statement.table, statement.column));
                }
            }
        } break;
        case "DROP COLUMN": {
            queries.push(util.format("ALTER TABLE %s DROP COLUMN %s;", statement.table, statement.column));
        } break;
    }

    return queries;
}

async function csSync(options) {
    let { sourceDir, targetDir, noExport, purge, outputSql, outputDrop, outputIgnore, execute } = options;

    let configs;
    if (noExport) {
        let configsDir = sourceDir ?? global.config.configsDir;
            if(configsDir == null) {
            throw "can't sync from local config since no configsDir is set";
        }
        configs = readConfigFiles(configsDir);
    } else {
        let tmpTargetDir = targetDir == null;
        if (tmpTargetDir) {
            let client = await initClient(global.config.connection, false);

            let prefix = util.format("%s_%s:%d", client.database, client.host, client.port);
            let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
            targetDir = util.format("/tmp/sync_%s.%s", prefix, formattedDate);
        }
    
        await csExport({ targetDir });
        configs = readConfigFiles(targetDir, [ "classes" ]);        
        if (tmpTargetDir) {
            fs.rmSync(targetDir, { recursive: true, force: true });    
        }    
    }

    let normalized = normalizeConfigs(configs);

    let schema = global.config.schema;

    let ignoreRules = ["cs_*", "geometry_columns", "spatial_ref_sys"];
    if (global.config.sync.noDropTables != null) {
        ignoreRules.push(... global.config.sync.noDropTables);
    } else {
        logInfo("no sync.noDropTables rules found");
    }

    let client = await initClient(global.config.connection);

    let allCidsClasses = [...normalized.classes];
    let allCidsClassesByTableName = {};

    let attributesCount = 0;
    for (let singleCidsClass of allCidsClasses) {
        if (singleCidsClass.table) {
            allCidsClassesByTableName[singleCidsClass.table] = singleCidsClass;
        }
        if (singleCidsClass.attributes) {
            attributesCount += singleCidsClass.attributes.length;
        }
    }
    logVerbose(util.format(" ↳ %d attributes found in %d classes.", attributesCount, normalized.classes.length));

    let existingData = {
        tables : {},
        sequences : []
    };

    logVerbose("Analysing existing sequences ...");
    let sequencesQuery = "SELECT sequence_name FROM information_schema.sequences ORDER BY sequence_name;";
    let { rows : sequencesResults } = await client.query(sequencesQuery);
    for (let result of sequencesResults) {
        let sequenceKey = result.sequence_name.toLowerCase();
        existingData.sequences.push(sequenceKey);
    }        
    logVerbose(util.format(" ↳ %d sequences found.", existingData.sequences.length));

    logVerbose("Analysing existing tables ...");
    let tablesQuery = "SELECT tables.table_schema AS table_schema, tables.table_type AS table_type, tables.table_name AS table_name, columns.column_name AS column_name, CASE WHEN columns.column_default ILIKE '%::' || columns.data_type THEN substring(columns.column_default, 0, length(columns.column_default) - length(columns.data_type) - 1) ELSE columns.column_default END AS column_default, columns.is_nullable = 'YES' AS column_is_nullable, columns.udt_name AS column_data_type, CASE WHEN columns.udt_name = 'bpchar' OR columns.udt_name = 'varchar' THEN columns.character_maximum_length WHEN columns.udt_name ILIKE 'numeric' THEN columns.numeric_precision ELSE NULL END AS column_precision, CASE WHEN columns.udt_name ILIKE 'numeric' THEN columns.numeric_scale ELSE NULL END AS column_scale FROM information_schema.tables LEFT JOIN information_schema.columns ON tables.table_name = columns.table_name AND tables.table_schema = columns.table_schema;";
    let { rows: tablesResults } = await client.query(tablesQuery);
    
    let ignoredTables = [];
    let ignoredSequences = [];

    for (let tablesResult of tablesResults) {
        let tableKey = (tablesResult.table_schema !== schema ? util.format("%s.%s", tablesResult.table_schema, tablesResult.table_name) : tablesResult.table_name);

        let ignoreTable = false;
        for (let ignoreRule of ignoreRules) {
            if (!ignoredTables.includes(tableKey) && wcmatch(ignoreRule)(tableKey)) {
                if (!ignoredTables.includes(tableKey)) {
                    ignoredTables.push(tableKey);

                    let sequenceKey = util.format("%s_seq", tableKey);
                    if (existingData.sequences.includes(sequenceKey)) {
                        existingData.sequences = existingData.sequences.filter((value) => {
                            if (value == sequenceKey) {
                                ignoredSequences.push(sequenceKey);
                            }
                            return value != sequenceKey;
                        });
                    }
                }
                ignoreTable = true;
                break;                    
            }
        }
        if (ignoreTable) {
            continue;
        }

        if (!existingData.tables.hasOwnProperty(tableKey)) {
            existingData.tables[tableKey] = { 
                name: tablesResult.table_name,
                tableType: tablesResult.table_type,
                schema: tablesResult.table_schema,
                columns: {}
            };
        }
        let columnKey = tablesResult.column_name;
        existingData.tables[tableKey].columns[columnKey] = {
            name: tablesResult.column_name,
            default: tablesResult.column_default,
            isNullable: tablesResult.column_is_nullable,
            dataType: tablesResult.column_data_type,
            precision: tablesResult.column_precision,
            scale: tablesResult.column_scale
        };
    }      
    
    logVerbose(util.format(" ↳ %d columns found in %d tables.", tablesResults.length, Object.keys(existingData.tables).length));

    logVerbose("Applying ignore rules ...");
    logVerbose(ignoreRules, { table: true });
    logDebug(" ↳ ignoring tables:");
    logDebug(ignoredTables, { table: true });
    logVerbose(" ↳ ignoring sequences:");
    logVerbose(ignoredSequences, { table: true });

    existingData.ignoredTables = ignoredTables;
    existingData.ignoredSequences = ignoredSequences;

    // start statements creation recursion

    logVerbose("Preparing sync statements ...");
    let statements = [];
    let tablesDone = [];
    let dropTables = [];
    let dropColumns = [];

    while(allCidsClasses.length > 0) {
        let cidsClass = allCidsClasses.pop();
        statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, cidsClass, normalized.config.sync.noDropColumns, dropColumns));
    }    
    if (statements.length > 0) {
        logVerbose(statements, { table: true });
    }

    // dropping unused tables

    for (let tableDone of tablesDone) {
        delete existingData.tables[tableDone];
    }
    Object.keys(existingData.tables).forEach(function(key) {
        if (!ignoredTables.includes(key)) {
            var tableData = existingData.tables[key];
            if (tableData.tableType.toUpperCase() === "BASE TABLE" && tableData.schema === schema) {
                let sequenceKey = util.format("%s_seq", key);
                statements.push({ action: "DROP TABLE", table: key, sequence: existingData.sequences.includes(sequenceKey) });
                dropTables.push(key);
            }
        }
    });

    // printing all statements

    if (statements.length > 0) {

        let skippedQueries = [];
        let subQueries = [];
        
        for (let statement of statements) {
            if (purge !== true && statement.action.startsWith("DROP ")) {
                skippedQueries.push(... queriesFromStatement(statement));
            } else {
                subQueries.push(... queriesFromStatement(statement));
            }
        }

        let sync = {
            dropTables: dropTables.sort(),
            dropColumns: dropColumns.sort(),
        };

        if (outputIgnore && (sync.dropTables.length > 0 || sync.dropColumns > 0)) {
            logOut(stringify(sync), { noSilent: true });
        }

        if (outputDrop && skippedQueries.length > 0)  {
            let query = "\n";
            query += "-- ########################################\n";
            query += "-- ### BEGIN OF SKIPPED QUERIES ###\n";
            query += "-- ########################################\n";
            query += "\n";
            query += skippedQueries.join("\n");
            query += "\n\n";
            query += "-- ######################################\n";
            query += "-- ### END OF SKIPPED QUERIES ###\n";
            query += "-- ######################################\n";

            logOut(query, { noSilent: true });
        }

        if (subQueries.length > 0) {
            let query = "\n";
            query += "-- ########################################\n";
            query += "-- ### BEGIN OF SYNCHRONISATION QUERIES ###\n";
            query += "-- ########################################\n";
            query += "\n";
            query += subQueries.join("\n");
            query += "\n\n";
            query += "-- ######################################\n";
            query += "-- ### END OF SYNCHRONISATION QUERIES ###\n";
            query += "-- ######################################\n";

            if (outputSql) {
                logVerbose("\nresulting sync queries:");
                logOut(query, { noSilent: true });
            }

            if (execute) {
                logOut(util.format("\nstart syncing (%d queries) ...", subQueries.filter((value) => {
                    return value.trim() != "" && !value.trim().startsWith("--");
                }).length));
                await client.query(query);
                logInfo(" ↳ syncing successfull");
            } else {
                logOut();
                logWarn("DRY RUN nothing has really happend yet. '-X|--sync' for execution");
            }
        } else {
            logInfo(" ↳ nothing to sync. done.");
        }
    } else {
        logInfo(" ↳ nothing to sync. done.");
    }
}   

export default csSync;