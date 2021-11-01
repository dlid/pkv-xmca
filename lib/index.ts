import { Logger } from './log/logService.class';
import { ConfigurationRoot } from './types/configuration.types';
import { Camera, CameraConnectionStatus } from '@dlid/savona';
import { loadConfiguration } from './functions/loadSettings.function';
import { PkvContext, startup } from './functions/startup.function';
import { Argument, Command  } from 'commander';

import { resolveConfigurationPaths } from './functions/resolveConfigurationPaths';
import { getConfigFilenameCommand } from './commands/get-config-filename.command';
import { ControlChange } from 'easymidi';
import { getVersion } from './functions/getVersion';
import { differenceInMilliseconds } from 'date-fns';

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
                const valueFromPercent = await cam.Iris.GetValueFromPercent(controllerValueAsPercent);
                if (valueFromPercent && tmpLastSetValue[cam.host]?.value != valueFromPercent) {
                    tmpLastSetValue[cam.host] = {value: valueFromPercent, time: new Date()};
                    await cam.Iris.SetValue(valueFromPercent as number);
                }
            } else {
                logger.info(`"{color:cyan}${cameras[0]}{color}" (${cam.host}) - is {color:yellow}not connected`);
            }
        }

    }
}


const tmpLastSetValue: { [key: string]: { value: number, time: Date }} = {};

(async () => {
    await startup(config).then(context => {
        context.xTouchMini.controllerChange.subscribe(async change => await onControllerChange(context, change));        

        // Subscribe to iris changes
        context.cameraManager.getCameraNames().forEach(async cameraName => {
            const cam = context.cameraManager.getCamera(cameraName);

            cam.connectionStatus.subscribe(async status => {
                if (status == CameraConnectionStatus.Connected) {
                    const irisValue = await cam.Iris.GetValue();
                    const irisValuePercent = await cam.Iris.GetPercentFromValue(irisValue);
                    let pos = (irisValuePercent as number / 127) * 127;
                    const irisController = context.cameraManager.getConfiguration(cameraName).iris?.controller;
                    if (irisController) {                    

                        context.xTouchMini.setControllerValue(irisController, pos)
                    }
                }
            });

            cam.Iris.addChangeHandler(async val => {
                
                const config = context.cameraManager.getConfiguration(cameraName);

                if (config.iris?.controller) {
                    
                    let theValue = await cam.Iris.GetPercentFromValue(val.Value as number) ;

                    let pos = (theValue as number / 127) * 127;



                    if (tmpLastSetValue[cam.host]?.value != val.Value) {

                        if (tmpLastSetValue[cam.host]?.time) {
                            const diff = differenceInMilliseconds(new Date(), tmpLastSetValue[cam.host].time);
//                            console.log("DIFF", diff);
                            if ( typeof diff !== 'undefined' && diff > 150) {
                                return;
                            }
                        } else {
                            context.xTouchMini.setControllerValue(config.iris.controller, pos);
                        }

                    }
                    // console.log("GOTIT", val.Value, ' => last set:', tmpLastSetValue[cam.host]);
                    // console.log("VAL", val.Value, "=>", theValue + '%', 'pos =>', pos);
                    // context.xTouchMini.setControllerValue(config.iris.controller, pos);
                    //context.xTouchMini.
                    //stopControllerLoadingAnimation.


                    //console.warn("CAMERA SAYS IRIS IS AT", val)

                }

            });

        })

    })
})();
