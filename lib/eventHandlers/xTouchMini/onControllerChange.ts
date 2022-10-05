// TBD - separate file for event when XTouchMini controller is changed 

import { ControlChange } from "easymidi";
import { PkvContext } from "../../functions/startup.function";
import { Logger } from "../../log/logService.class";

// TODO: Double check what this does and why/if it's needed
let timers: { [name: string]: NodeJS.Timeout} = {};
let cameraIrisApplyMs = 250;



export async function onControllerChange(context: PkvContext, change: ControlChange): Promise<void> {

    const log = Logger.getInstance().for('onXTouchControllerChange');

    // Try to get all cameras that have a Controller action assigned
    const cameras = context.cameraManager.getCamerasForController(change.controller, change.channel);
    
    if (cameras.length === 1) {
        
        const cam = context.cameraManager.getCamera(cameras[0]);
        const cameraConfig = context.cameraManager.getConfiguration(cameras[0]);
        const allIrisValues: number[] =  context.cache.get<number[]>(`camera.irisvalues:${cameras[0]}`, []) ?? await cam.Iris.GetIrisValues();


        if (cameraConfig.iris?.controller == change.controller) {
            if (cam.isConnected) {

                const prevControllerValue = context.cache.get<number>(`controller:${change.controller}`);

                const direction = prevControllerValue !== null ? prevControllerValue > change.value ? 'left' : 'right' : 'unknown';

                var currentIrisValue = await cam.Iris.GetValue();

                let irisIndex = allIrisValues.indexOf(currentIrisValue);

                if (prevControllerValue == change.value) {
                    return;
                }

                log.info(`Controller ${change.controller} = ${change.value} (${prevControllerValue})`, direction);
//                console.log(JSON.stringify(allIrisValues));
                // Update controller value in cache so we can detect which way the knob was turned

  //              context.cache.set(`controller:${change.controller}`, change.value);

    //            clearTimeout(timers[`controller:${change.controller}`]);

//                timers[`controller:${change.controller}`] = setTimeout(async () => {
//                    console.log("IRIS", currentIrisValue, irisIndex);
                    if (direction == 'right') {
                        if (irisIndex == allIrisValues.length - 1) {
                            irisIndex = 0;
                        } else {
                            irisIndex++;
                        }
                    } else {
                        irisIndex--;
                    }
                    //console.log("SET TO", irisIndex * 5);
                    //context.xTouchMini.setControllerValue(change.controller, irisIndex * 5);
//                    console.log("SET IRIS TO", irisIndex, '=>', allIrisValues[irisIndex]);
                    await cam.Iris.SetValue(allIrisValues[irisIndex]);

                    context.cache.set(`iris_updated_from_controller:${cameras[0]}`, true, 250);


                    setTimeout(() => {
                        context.xTouchMini.setControllerValue(change.controller, (irisIndex - 5) * 5);
                        context.cache.set(`controller:${change.controller}`, (irisIndex - 5) * 5);
                    }, 5);


  //              }, 100);
        


                // // As long as value < than array of available indexes. Just set the value
                // if (change.value < allIrisValues.length) {
                //     await cam.Iris.SetValue(allIrisValues[change.value] as number);
                // }

                // // if (cameraIrisTimer[cam.host]) {
                // //     clearTimeout(cameraIrisTimer[cam.host]);
                // // }

                // await cam.Iris.SetValue(change.value);

                // // TODO: Maybe use cameraIrisTimer here. When we have not received any updates for X ms then set 
                // // the controller value?

                // // const valueFromPercent = await cam.Iris.GetValueFromPercent(controllerValueAsPercent);
                // // if (valueFromPercent && tmpLastSetValue[cam.host]?.value != change.value) {
                //     // tmpLastSetValue[cam.host] = {value: change.value, time: new Date()};
                // // }

            } else {
                log.info(`"{color:cyan}${cameras[0]}{color}" (${cam.host}) - is {color:yellow}not connected`);
            }
        }

    }
}