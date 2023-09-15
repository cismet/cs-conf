function reorganizeConfig(config) {
    if (config != null) {
        let sync = config.sync;
        if (sync != null) {
            let noDropTables = sync.noDropTables;
            if (noDropTables != null) {
                sync.noDropTables = noDropTables.sort();
            }
            let noDropColumns = sync.noDropColumns;
            if (noDropColumns != null) {
                sync.noDropColumns = noDropColumns.sort();
            }
        }
    }
    return config;
}

export default reorganizeConfig;