function prepareDomains(domains) {
    let csDomainEntries = [];
    for (let domain of domains) {
        csDomainEntries.push([ 
            domain.domainname 
        ]);
    }
    return { csDomainEntries };
}

export default prepareDomains;