// TBD - separate file for event when XTouchMini button is pressed down

import { PkvContext } from "../../functions/startup.function";
import { Logger } from "../../log/logService.class";
import { NotChangeEvent } from "../../xTouchMini.class";
import onButtonDown_ToggleIrisAuto from "./onButtonDown_ToggleIrisAuto";

/***
 * When an xtouch button is pressed down
 */
export async function onButtonDown(context: PkvContext, event: NotChangeEvent) {

    // This method is called for all buttons (notes) when they are pressed down

    // TOGGLE IRIS AUTO - find all buttons (notes) that have setManualNote setting to the current note and call method to handle it
    context.cameraManager.getCameraNames()
        .filter(c => context.cameraManager.getConfiguration(c).iris?.setManualNote == event.note)
        .forEach(async cameraName => await onButtonDown_ToggleIrisAuto(context, cameraName, event.note) );

}


/**
 * Method that will check if the pressed button should toggle automatic/manual iris for some camera(s)
 */
// async function handleToggleIrisAuto(context: PkvContext, event: NotChangeEvent): Promise<void> {

//     const logger = Logger.getInstance().for('handleToggleIrisAuto');

//     // Find all cameras that have the pressed buttonId (event.note) configured
//     const cameras = context.cameraManager.getCameraNames()
//         .filter(c => context.cameraManager.getConfiguration(c).iris?.setManualNote == event.note)
//         .map(cameraName => {
//             return {
//                 cameraName,
//                 camera: context.cameraManager.getCamera(cameraName),
//                 camConfig: context.cameraManager.getConfiguration(cameraName)
//             }
//         });

//     cameras.forEach(async cameraInfo => {

//     })


//     // context.cameraManager.getCameraNames().forEach(async camName => {
//     //     const config = context.cameraManager.getConfiguration(camName);
//     //     const cam = context.cameraManager.getCamera(camName);

//     //     logger.debug(`OnNoteChange`, event);

//     //     if (config.iris?.setManualNote) {
//     //         logger.debug(`camera config manual button`, config.iris?.setManualNote);
//     //         if (config.iris?.setManualNote == event.note) {
//     //             const currentSetting = await cam.Iris.GetSetting();
//     //             logger.debug(`iris setting`, currentSetting);
//     //             if (currentSetting == 'Automatic') {
//     //                 logger.debug(`Setting to manual`);
//     //                 await cam.Iris.SetManual();
//     //                 const irisValue = await cam.Iris.GetValue();
//     //                 const irisValuePercent = await cam.Iris.GetPercentFromValue(irisValue);
//     //                 let pos = (irisValuePercent as number / 127) * 127;
//     //                 const irisController = context.cameraManager.getConfiguration(camName).iris?.controller;
//     //                 if (irisController) {                    
//     //                     context.xTouchMini.setControllerValue(irisController, pos)
//     //                 }
//     //             } else {
//     //                 await cam.Iris.SetAuto();
//     //             }
//     //         }
//     //     }

//     // })



// }