function prepareDomains(domains) {
    let csDomainEntries = [];
    for (let d of domains) {
        csDomainEntries.push([d.domainname]);
    }
    return { csDomainEntries };
}

export default prepareDomains;