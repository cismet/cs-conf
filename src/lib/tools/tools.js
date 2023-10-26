import chalk from 'chalk';

export function clean(obj) {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
    return obj;
}

export function logOut(out, options = {}) {
    let { noSilent, debugging, verbose, information, warning, error, table } = options;

    if (error) {
        out != null ? console.error(chalk.red(out)) : console.error();
    } else if (debugging) {
        if (global.debug) {
            process.stdout.write(chalk.blue("[DEBUG] "));
            table ? console.table(out) : out != null ? console.log(out) : console.log();
        }
    } else if (noSilent || !global.silent) {
        if (warning) {
            let chalkOrange = chalk.hex('#FFA500')
            process.stdout.write(chalkOrange("[WARNING] "));
            out != null ? console.log(out) : console.log();
        } else if (information) {
            out != null ? console.log(chalk.yellow(out)) : console.log();
        } else {
            if (!verbose || global.verbose) {
                table ? console.table(out) : out != null ? console.log(out) : console.log();
            }
        }
    }
}

export function logVerbose(text, options = {}) {
    logOut(text, Object.assign(options, { verbose: true }));
}

export function logErr(text, options = {}) {
    logOut(text, Object.assign(options, { error: true }));
}

export function logWarn(text, options = {}) {
    logOut(text, Object.assign(options, { warning: true }));
}

export function logInfo(text, options = {}) {
    logOut(text, Object.assign(options, { information: true }));
}

export function logDebug(text, options = {}) {
    logOut(text, Object.assign(options, { debugging: true }));
}

export function topologicalSort(graph) {
    let result = [];
    let visited = new Set();
    let visiting = new Set();
  
    function visit(node) {
      if (visiting.has(node)) throw Error("Cycle detected in the dependency graph.");
  
      if (!visited.has(node)) {
        visiting.add(node);
        for (let dependent of graph[node]) {
          visit(dependent);
        }
        visiting.delete(node);
        visited.add(node);
        result.push(node);
      }
    }
  
    for (let node in graph) {
      visit(node);
    }
  
    return result;
}
  
