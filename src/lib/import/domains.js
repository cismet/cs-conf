function prepareDomains(domains) {
    let csDomainEntries = [];
    for (let domain of domains) {
        csDomainEntries.push([ 
            domain.domainname,
            csDomainEntries.length + 1,
        ]);
    }
    return { csDomainEntries };
}

export default prepareDomains;