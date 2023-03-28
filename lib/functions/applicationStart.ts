import { Argument, Command } from "commander";
import { getConfigFilenameCommand } from "../commands/get-config-filename.command";
import { Logger } from "../log/logService.class";
import { ConfigurationRoot } from "../types/configuration.types";
import { getVersion } from "./getVersion";
import { loadConfiguration } from "./loadSettings.function";
import { resolveConfigurationPaths } from "./resolveConfigurationPaths";

export default function applicationStart(): ConfigurationRoot {

    const program = new Command();                                  // npm library for parsing command line parameters https://www.npmjs.com/package/commander
    const logger = Logger.getInstance().for('applicationStart');    // Create instance of our logger
    let configurationFile: string = '';                             // Filename of configuration file used
    let config: ConfigurationRoot | undefined;                      // The loaded configuration

    // Set version of pkv-xmca from package.json file
    program.version(getVersion());

    // Command to list how configuration file will be searched for
    // node ./ get-config-filename
    program
        .command('get-config-filename')
        .addArgument(new Argument('[configFile]', 'Path to JSON file that you want to test how its loaded'))
        .action((filename: string) => getConfigFilenameCommand(filename));

    // node ./ <config.json>
    program
        .addArgument(new Argument('[configFile]', 'Path to JSON file containing configuration').default('./pkv-xmca.json'))
        .option('-v, --verbose', 'Extended logging output')
        .action((configFile: string) => {
            configurationFile = configFile;
        }).parse();

    const commandLineOptions = program.opts();

    // Setup log level
    if (commandLineOptions.verbose === true) {
        logger.logLevel = 'debug';
    }

    logger.debug(`Loading configuration file`);
    for (let file of resolveConfigurationPaths(configurationFile)) {
        config = loadConfiguration(file);
        if (config) {
            break;
        }
    }

    if (!config) {
        logger.error(`Configuration file was not found`);
        process.exit(13); 
    }

    return config;

}