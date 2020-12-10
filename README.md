# kpm
Koala Package Manager



# behavioral flags
If executed without any of the following flags, production configuration 
will be applied and .git directory will be removed after install.

`--dev` - Set Environment to 'dev' and apply dev mode configuration.

`--preserve-vcs` - Keep .git directory after install (only with `--dev`)

`--no-upgrade` - Don't generate upgrade trigger file and delete if already 
    present



# miscellaneous flags

`--debug` - Output additional information necessary for debugging

`-V | --version` - Output installed kpm version



# configuration

If `package.json` doesn't exist, the package manager won't do anything.
If `package.json` doesn't have a `koala` node at the root level, the most 
up-to-date version of the Koala Framework will be installed. Otherwise, the 
version specified in `koala.version` (string)  will be installed (if 
available). 

Extensions can be installed and upgraded automatically by adding them as 
`"name": "version"` pairs on the `koala.extensions` object.