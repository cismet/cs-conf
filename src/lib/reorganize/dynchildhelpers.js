function reorganizeDynchildhelpers(dynchildhelpers) {
    if (dynchildhelpers != null) {
        dynchildhelpers = dynchildhelpers.sort((a, b) => {
            let aName = a.name.toUpperCase();
            let bName = b.name.toUpperCase();        
            return aName.localeCompare(bName);
        });
    }           
    return dynchildhelpers;
}

export default reorganizeDynchildhelpers;