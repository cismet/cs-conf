# csconf

cids system manipilation and mantainance tool

## Usage
```
Usage: csconf [options] [command]

Options:
  -V, --version         output the version number
  -h, --help            output usage information

Commands:
  
  config [options]      creates a new config file
  
  import [options]      imports the (cs_*)meta-information from a configuration directory into a database
  backup [options]      backups the (cs_*)meta-information to a file
  restore [options]     restores the (cs_*)meta-information from a backup file
  
  check [options]       checks configuration for errors
  normalize [options]   normalizes the configuration in a given directory
  reorganize [options]  reorganizes the configuration in a given directory
  simplify [options]    simplifies the configuration in a given directory
  
  password [options]    generates password hashes for the usermanagement
  sync [options]        synchronizes classes with the database
  
  export [options]      exports the (cs_*)meta-information of a database into a configuration directory
  create [options]      creates and initializes cs_tables on a given database
  truncate [options]    truncates the cs_tables on a given database
  purge [options]       purges the cs_tables on a given database
```
