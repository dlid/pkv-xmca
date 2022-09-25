// TBD - separate file for event when XTouchMini controller is changed 

import { ControlChange } from "easymidi";
import { PkvContext } from "../../functions/startup.function";
import { Logger } from "../../log/logService.class";

// TODO: Double check what this does and why/if it's needed
let cameraIrisTimer: { [name: string]: NodeJS.Timeout} = {};
let cameraIrisApplyMs = 250;


export async function onControllerChange(context: PkvContext, change: ControlChange): Promise<void> {

    const log = Logger.getInstance().for('onXTouchControllerChange');

    // Try to get all cameras that have a Controller action assigned
    const cameras = context.cameraManager.getCamerasForController(change.controller, change.channel);
    
    if (cameras.length === 1) {
        
        const cam = context.cameraManager.getCamera(cameras[0]);
        const cameraConfig = context.cameraManager.getConfiguration(cameras[0]);
        const allIrisValues = await cam.Iris.GetIrisValues();

        if (cameraConfig.iris?.controller == change.controller) {
            if (cam.isConnected) {

                // As long as value < than array of available indexes. Just set the value
                if (change.value < allIrisValues.length) {
                    await cam.Iris.SetValue(allIrisValues[change.value] as number);
                }

                // if (cameraIrisTimer[cam.host]) {
                //     clearTimeout(cameraIrisTimer[cam.host]);
                // }

                await cam.Iris.SetValue(change.value);

                // TODO: Maybe use cameraIrisTimer here. When we have not received any updates for X ms then set 
                // the controller value?

                // const valueFromPercent = await cam.Iris.GetValueFromPercent(controllerValueAsPercent);
                // if (valueFromPercent && tmpLastSetValue[cam.host]?.value != change.value) {
                    // tmpLastSetValue[cam.host] = {value: change.value, time: new Date()};
                // }

            } else {
                log.info(`"{color:cyan}${cameras[0]}{color}" (${cam.host}) - is {color:yellow}not connected`);
            }
        }

    }
}