import { Logger } from './../log/logService.class';
import { readFileSync } from 'fs';
import { ConfigurationRoot } from './../types/configuration.types';

export function loadConfiguration(filename: string): ConfigurationRoot | undefined {

    let fileContent: string;
    let result: ConfigurationRoot;
    let logger  = Logger.getInstance().for('configuration');

    try {
        const fileBuffer = readFileSync(filename);
        fileContent = fileBuffer.toString();
    } catch (ex: any) {
        logger.debug(`Could not load config file ${filename}`, ex)
        return undefined;
    }
    
    try {
        result = JSON.parse(fileContent) as ConfigurationRoot;
        logger.info(`Loaded Configuration from ${filename}`)
    } catch (ex: any) {
        logger.error(`Could not parse config file ${filename} as JSON`, ex)
        process.exit(11);
    }

    return result;
}