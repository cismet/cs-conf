#cs-conf

Exports and imports the configuration of an existing cids system in version 6.1. it is usefull for migrating
systems (or parts of systems) and it will be the tool to upgrade systems to version 7 and above.


## Usage
```
cs-conf export [to <folder>] [for <serverFolder>] [options]
or
cs-conf import [from <folder>] [to <serverFolder>] [in <targetSchema>] [options]




gitclick create [<repository>] [as <organization>] [on <account>] [options]

  <repository>      Defaults to the name of the current folder
  <organization>    Defaults to personal account
  <account>         Defaults to the default account

  --set-remote      Add the created repo as remote ('origin' if not set to anything else)
  --no-issues       Create the repository without issues
  --no-wiki         Create the repository without a wiki
  --private         Create the repository privately

gitclick use <account>       Set <account> as default account
gitclick add                 Interactive prompt for creating a new account
gitclick remove <account>    Remove <account>
gitclick list                List your existing accounts
gitclick default             Displays default account

gitclick encrypt             Encrypt your configuration with a password
gitclick decrypt             Permanently decrypt your configuration

gitclick -v, --version       Output version number
gitclick -h, --help          Output usage information
```