module.exports.printHelpText = async function printHelpText() {
    const helpText = `Usage: kpm <command [...args]> [<...options>]

Available commands:
  help                         Display this help page.
  version                      Print the current kpm version
  version <package>            Print the installed package version
  install                      Install dependencies listed in the 'koala' 
                               section in package.json and apply 
                               configuration for selected environment.
  add <package>@<version>      Add a new package. Package name 'koala' or 
                               'core' installs koala.
  update <package>@<version>   Update package to specified version.
  remove <package>             Remove specified package (not core).
  clear-cache                  Clear koala cache directory.
  clear-temp                   Clear koala temp directory.
  clear                        Clear koala cache and temp directory.
  inspect                      Print current project configuration.

Available flags:
  -D | --dev            Set environment to 'dev'. Default is 'prod'.
  -p | --preserve-vcs   Preserves the packages .git directory after 
                        add / install / update actions. Only works 
                        with the '--dev' flag.
  --no-upgrade          Suppress generation of 'upgrade' file after
                        add / install / update / remove actions.        
  -v | --debug          Verbose - Show debug information 
  -f | --force          Force install / update packages that contain
                        a .git directory. Use with caution - changes 
                        in the source code repository that haven't 
                        been pushed to the remote repository will be 
                        lost forever.
    `
    console.info(helpText + '\n');
}