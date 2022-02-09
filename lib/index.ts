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
import { NotChangeEvent } from './xTouchMini.class';

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
    
    // console.log(`${change.controller} => `, controllerValueAsPercent);

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

async function onNoteChange(context: PkvContext, change: NotChangeEvent): Promise<void> {

    if (change.type == 'on') {
        context.cameraManager.getCameraNames().forEach(async camName => {
            const config = context.cameraManager.getConfiguration(camName);
            const cam = context.cameraManager.getCamera(camName);

            logger.debug(`OnNoteChange`, change);

            if (config.iris?.setManualNote) {
                logger.debug(`camera config manual button`, config.iris?.setManualNote);
                if (config.iris?.setManualNote == change.note) {
                    const currentSetting = await cam.Iris.GetSetting();
                    logger.debug(`iris setting`, currentSetting);
                    if (currentSetting == 'Automatic') {
                        logger.debug(`Setting to manual`);
                        await cam.Iris.SetManual();
                        const irisValue = await cam.Iris.GetValue();
                        const irisValuePercent = await cam.Iris.GetPercentFromValue(irisValue);
                        let pos = (irisValuePercent as number / 127) * 127;
                        const irisController = context.cameraManager.getConfiguration(camName).iris?.controller;
                        if (irisController) {                    
                            context.xTouchMini.setControllerValue(irisController, pos)
                        }
                    }
                }
            }

        })
    }

}

const tmpLastSetValue: { [key: string]: { value: number, time: Date }} = {};

(async () => {
    await startup(config).then(context => {
        context.xTouchMini.controllerChange.subscribe(async change => await onControllerChange(context, change));        
        context.xTouchMini.noteChange.subscribe(async change => await onNoteChange(context, change))

        // Subscribe to iris changes
        context.cameraManager.getCameraNames().forEach(async cameraName => {
            const cam = context.cameraManager.getCamera(cameraName);

            cam.connectionStatus.subscribe(async status => {
                if (status == CameraConnectionStatus.Connected) {

                    const settingValue = await cam.Iris.GetSetting();
                    const settingNote = context.cameraManager.getConfiguration(cameraName).iris?.settingBlinkNote;

                    if (typeof settingNote !== 'undefined') {
                        if (settingValue == 'Automatic') {
                            context.xTouchMini.setNoteValue(settingNote, 2);
                        } else {
                            context.xTouchMini.setNoteValue(settingNote, 0);
                        }
                    }

                   // console.warn("LAAALAL", settingNote)
                   // context.xTouchMini.setNoteValue(<any>settingNote, 2, 10);
                   // context.xTouchMini.setNoteValue(2, 2);
//                        cam.Iris.SetManual();

                    const irisValue = await cam.Iris.GetValue();
                    const irisValuePercent = await cam.Iris.GetPercentFromValue(irisValue);
                    let pos = (irisValuePercent as number / 127) * 127;
                    const irisController = context.cameraManager.getConfiguration(cameraName).iris?.controller;
                    if (irisController) {                    

                        context.xTouchMini.setControllerValue(irisController, pos)
                    }
                }
            });

            cam.Iris.onSettingMethodChanged(async setting => {
                // console.log("SETTING: ", setting);
                const settingNote = context.cameraManager.getConfiguration(cameraName).iris?.settingBlinkNote;

                if (typeof settingNote !== 'undefined') {
                    if (setting == 'Automatic') {
                        // console.log("SET", settingNote, "to", 2);
                        context.xTouchMini.setNoteValue(settingNote, 2);
                    } else {
                        // console.log("SET", settingNote, "to", 0);
                        context.xTouchMini.setNoteValue(settingNote, 0);
                    }
                }

            })

            cam.Iris.addChangeHandler(async val => {
                
                const config = context.cameraManager.getConfiguration(cameraName);

//                console.log(val);

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
