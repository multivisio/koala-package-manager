#!/usr/bin/env node
const process = require('process');
const environment = require('child_process');
const ini = require('ini');
const fs = require('fs').promises;
const rmrf = async path => fs.rmdir(path, {recursive: true});

if(process.argv.indexOf('-V') > -1 || process.argv.indexOf('--version') > -1) {
    const pkgjson = require('fs').readFileSync(`${__dirname}/package.json`).toString();
    const config = JSON.parse(pkgjson);
    const version = config.version;
    const issues = config.bugs.url;
    console.log(`Koala Package Manager v${version}`);
    console.log(`Report issues at ${issues}\n`);
    process.exit(0);
}

const devMode = (process.argv.indexOf('--dev') > -1);
const debugMode = (process.argv.indexOf('--debug') > -1);
const preserveVcs = devMode && (process.argv.indexOf('--preserve-vcs') > -1);
const upgradeTrigger = (process.argv.indexOf('--no-upgrade') < 0);

const sysRepoUrl = 'git@gitlab.multivisio.net:koala/system/koala.git';
const extRepoUrl = 'git@gitlab.multivisio.net:koala/extensions';

function extensionName(extensionName) {
    return extensionName.toUpperCase();
}

async function getConfig() {
    const pkgFile = await fs.readFile(`./package.json`, {flag: 'r'});
    const pkgJson = pkgFile.toString();
    const pkgConfig = JSON.parse(pkgJson);
    const config = typeof pkgConfig.koala !== 'undefined' ?
        pkgConfig.koala :
        {
            version: 'master',
            'extensions': {},
            'options': {dev: {}, prod: {}},
        };

    if (typeof config.version === 'undefined') {
        config.version = 'master';
    }
    if (typeof config.options === 'undefined') {
        config.options = {};
    }
    if (typeof config.extensions === 'undefined') {
        config.extensions = {};
    }

    return config;
}

async function exec(cmd) {
    debug(cmd);
    return new Promise((resolve, reject) => {
        environment.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

async function removeExtension(name) {
    debug(`Removing ${name} extension directory...`);
    return rmrf(`./Ext/${extensionName(name)}`);
}

async function removeSystemFiles() {
    debug(`Removing Koala directory...`);
    return rmrf('./Koala');
}

async function installExtension(name, version) {
    const extName = extensionName(name);
    const shallow = devMode && !preserveVcs ? '--depth=1' : '';
    let command = `git clone ${shallow}`;
    command = `${command} ${extRepoUrl}/${name}.git`;
    command = `${command} -b v${version} ./Ext/${extName}`;
    console.info(`Installing: ${name}@${version}`);
    await removeExtension(name);
    await exec(command);

    if (!preserveVcs) {
        debug('Removing VSC Directory...');
        await rmrf(`./Ext/${extName}/.git`);
    }
}

function debug(message) {
    if (debugMode) {
        console.debug('[DEBUG]', message);
    }
}

async function installSystem(version) {
    const shallow = devMode && !preserveVcs ? '--depth=1' : '';
    let command = `git clone ${shallow} ${sysRepoUrl}`;
    command = `${command} -b v${version} ./Koala`;
    console.log(`Installing: koala@${version}`);
    await removeSystemFiles();
    await exec(command);

    if (!preserveVcs) {
        debug('Removing VSC Directory...');
        await rmrf(`./Koala/.git`);
    }
}

async function getOptions() {
    const optionsFile = (await fs.readFile(
        './Koala/Config/config.ini',
        {flag: 'r'},
    )).toString();
    return ini.parse(optionsFile);
}

async function saveOptions(data) {
    const iniData = ini.stringify(data);
    await fs.writeFile(
        './Koala/Config/config.ini',
        iniData,
        {flag: 'w'},
    );
}

async function setOptions(options) {
    if (typeof options.dev === 'undefined') {
        options.dev = {};
    }
    if (typeof options.prod === 'undefined') {
        options.prod = {};
    }

    const opts = devMode ? options.dev : options.prod;
    const section = devMode ? 'dev : main' : 'main';
    const optionFile = await getOptions();
    for (let key in opts) {
        if (opts.hasOwnProperty(key)) {
            console.log(
                `Setting option "${key}" to "${opts[key]}" in section "${section}"`,
            );
            optionFile[section][key] = ini.safe(opts[key]);
        }
    }
    await saveOptions(optionFile);
}

async function generateUpgradeTrigger() {
    console.info('Generating system upgrade trigger...')
    debug('Creating empty regular file \'./upgrade\'');
    await fs.writeFile('./upgrade', '');
}

async function removeUpgradeTrigger() {
    debug('Checking if regular file \'./upgrade\' exists...');
    try {
        await fs.stat('./upgrade');
        debug('File found. Removing regular file \'upgrade\' ...');
        console.info('Removing upgrade trigger...');
        await fs.unlink('./upgrade');
    } catch {
        debug('File \'./upgrade\' not found.');
    }
}

(async () => {
    try {
        const config = await getConfig();
        await installSystem(config.version);
        for (let key in config.extensions) {
            if (config.extensions.hasOwnProperty(key)) {
                await installExtension(key, config.extensions[key]);
            }
        }
        await setOptions(config.options);
        if(upgradeTrigger) {
            await generateUpgradeTrigger();
        } else {
            await removeUpgradeTrigger();
        }
        console.info('Clearing cache and temporary files...');
        await exec('npm run clearcache');
    } catch (exception) {
        console.warn(debugMode ? exception : exception.message);
    }
})();
