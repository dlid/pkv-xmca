import { Logger } from './log/logService.class';
import { ConfigurationRoot } from './types/configuration.types';
import { Camera } from '@dlid/savona';
import { loadConfiguration } from './functions/loadSettings.function';
import { PkvContext, startup } from './functions/startup.function';
import { Argument, Command  } from 'commander';

import { resolveConfigurationPaths } from './functions/resolveConfigurationPaths';
import { getConfigFilenameCommand } from './commands/get-config-filename.command';
import { ControlChange } from 'easymidi';
import { getVersion } from './functions/getVersion';

const program = new Command();
const logger = Logger.getInstance();
let configurationFile: string = '';
let config: ConfigurationRoot | undefined;





program.version(getVersion());

// Command to list how configuration file will be searched for
program.command('get-config-filename')
    .addArgument(new Argument('[configFile]', 'Path to JSON file that you want to test how its loaded'))
    .action((filename: string) => getConfigFilenameCommand(filename));

program.addArgument(new Argument('[configFile]', 'Path to JSON file containing configuration').default('./pkv-xmca.json'))
    .option('-v, --verbose', 'Extended logging output')
    .action((configFile: string) => {
        configurationFile = configFile;
    })
    .parse();

const options = program.opts();

// Setup log level
if (options.verbose === true) {
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
    console.log("Configuration file was not found");
    process.exit(13); 
}

let cameraIrisTimer: { [name: string]: NodeJS.Timeout} = {};
let cameraIrisApplyMs = 250;



async function onControllerChange(context: PkvContext, change: ControlChange): Promise<void> {
    // Try to get all cameras that have a Controller action assigned
    const cameras = context.cameraManager.getCamerasForController(change.controller, change.channel);
    const controllerValueAsPercent = (change.value / 127);
    
    //console.log(`${change.controller} => `, controllerValueAsPercent);

    if (cameras.length === 1) {
        
        const cam = context.cameraManager.getCamera(cameras[0]);
        const settings = context.cameraManager.getConfiguration(cameras[0]);
 
        if (settings.iris?.controller == change.controller) {
            if (cam.isConnected) {
                if (cameraIrisTimer[cam.host]) {
                    clearTimeout(cameraIrisTimer[cam.host]);
                }
                cameraIrisTimer[cam.host] = setTimeout( async () => {
                    console.log("SET IRIS VALUE", controllerValueAsPercent);
                }, cameraIrisApplyMs);

            } else {
                logger.info(`"{color:cyan}${cameras[0]}{color}" (${cam.host}) - is {color:yellow}not connected`);
            }
        }

    }
}


(async () => {
    await startup(config).then(context => {
        context.xTouchMini.controllerChange.subscribe(async change => await onControllerChange(context, change));        

        // Subscribe to iris changes
        context.cameraManager.getCameraNames().forEach(cameraName => {
            const cam = context.cameraManager.getCamera(cameraName);

            cam.Iris.addChangeHandler(val => {
                console.warn("CAMERA SAYS IRIS IS AT", val)
            });

        })

    })
})();
