# cs-conf

Exports and imports the configuration of an existing cids system in version 6.1. it is usefull for migrating
systems (or parts of systems) and it will be the tool to upgrade systems to version 7 and above.


## Usage
```
Usage: cs-conf [options] [command]

  Options:

    -V, --version        output the version number
    -c, --config <path>  set config path.  (default: ./runtime.properties)
    -h, --help           output usage information

  Commands:

    import|i [options]   imports the meta information into the cids system
    export|e [options]   exports the meta information of a cids system


Usage: export|e [options]

  exports the meta information of a cids system

  Options:

    -f, --configDir <configDir>  the configDir where the config will be written (default: config)
    -s, --schema <schema>  the schema where the cs-Tables are (default: public)
    -o, --only             Only export the following topics
    -x, --skip             Skip the export of the following topics
    -C, --classes          The classes with their attributes and permissions
    -S, --structure        The structure information of the system
    -U, --usermanagement   The users and their groups
    -h, --help             output usage information

Usage: import|i [options]

  imports the meta information into the cids system

  Options:

    -f, --configDir <configDir>  the configDir where the config is (default: config)
    -s, --schema <schema>  the schema where the cs-Tables will be (default: public)
    -o, --only             Only import the following topics
    -x, --skip             Skip the import of the following topics
    -C, --classes          The classes with their attributes and permissions
    -S, --structure        The structure information of the system
    -U, --usermanagement   The users and their groups
    -h, --help             output usage information

```
