import { existsSync } from "fs";
import { resolveConfigurationPaths } from "../functions/resolveConfigurationPaths";
import { Logger } from "../log/logService.class";

const logger = Logger.getInstance().for('get-config-filename');

export function getConfigFilenameCommand(filename: string, defaultFilename = './pkv-xmca.json'): void {

    console.log(` This is the order of how pkv-xmca will look for the configuration file you specify`);
    console.log(`\n`);
    let fileFound: string = '';
    resolveConfigurationPaths(filename || defaultFilename).forEach((filename: string, i: number) => {
        const fileExists = existsSync(filename);
        let state = '';
        
        if (fileExists) {
            if (!fileFound) {
                state = logger.bepaint(`{color:green}EXISTS  {color}`);
            } else {
                state = logger.bepaint(`{color:yellow}IGNORED{color}`);
            }
        } else {
            if (!fileFound) {
                state = logger.bepaint(`{color:red}MISSING{color}`);
            } else {
                state = logger.bepaint(`{color:yellow}IGNORED{color}`);
            }
        }

        if (fileExists && !fileFound) {
            fileFound = filename;
        }

        console.log(`[${state}] ${filename}`);

    });

    if (fileFound) {
        console.log(logger.bepaint(`\nThe file {color:green}${fileFound}{color} will be loaded.`));
        process.exit(0);
    } else {
        console.log(logger.bepaint(`\n{color:red}None of the configuration files was found{color}`));
        process.exit(1);
    }
}