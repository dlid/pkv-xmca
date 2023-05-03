// TBD - separate file for event when XTouchMini controller is changed 

import { ControlChange } from "easymidi";
import { PkvContext } from "../../functions/startup.function";
import { Logger } from "../../log/logService.class";
import { IrisControllerRange } from "../camera/onCameraConnected";

// TODO: Double check what this does and why/if it's needed
let timers: { [name: string]: NodeJS.Timeout} = {};
let cameraIrisApplyMs = 250;



export async function onControllerChange(context: PkvContext, change: ControlChange): Promise<void> {

    const log = Logger.getInstance().for('onControllerChange');

    try {



    // Try to get all cameras that have a Controller action assigned
    const cameras = context.cameraManager.getCamerasForController(change.controller, change.channel);
    
    if (cameras.length === 1) {
        
        const cam = context.cameraManager.getCamera(cameras[0]);
        const cameraConfig = context.cameraManager.getConfiguration(cameras[0]);
        const allIrisValues: number[] =  context.cache.get<number[]>(`camera.irisvalues:${cameras[0]}`, []) ?? await cam.Iris.GetIrisValues();

        if (cameraConfig.iris?.controller == change.controller) {
            if (cam.isConnected) {

                const ranges = context.cache.get<IrisControllerRange[]>(`camera.controller.range:${cameras[0]}`) as IrisControllerRange[];
                
                const prevControllerValue = context.cache.get<number>(`controller:${change.controller}`);

                const direction = prevControllerValue !== null ? prevControllerValue > change.value ? 'left' : 'right' : 'unknown';

                var autoSetting = await cam.Iris.GetSetting();
                log.debug(`Camera ${cameras[0]} controller turned ${direction}`);
                

                if (autoSetting == 'Automatic') {
                    log.info(`Detected Automatic Iris. Switching to Manual`);
                    await cam.Iris.SetManual();
                }

                var currentIrisValue = await cam.Iris.GetValue();


                let irisIndex = allIrisValues.indexOf(currentIrisValue);

                if (prevControllerValue == change.value) {
                    return;
                }

               // log.info(`Controller ${change.controller} = ${prevControllerValue} => ${change.value}`, direction);

                if (typeof prevControllerValue !== 'undefined' && prevControllerValue != null) {
                        const ix = ranges.findIndex(f => prevControllerValue >= f.startIndex && 
                            typeof f.endIndex != 'undefined' &&  prevControllerValue <= f.endIndex);

                        
                            let changeTo: IrisControllerRange;
                            let current: IrisControllerRange | null = ix != -1 ? ranges[ix] : null;
                        
                        if (direction == 'right') {
                            changeTo = ranges[ix + 1];
                        } else {
                            changeTo = ranges[ix -1];
                        }

                        if (!changeTo) {
                            log.warn( `Iris value changed but changeTo was nullish`);
                            return;
                        }

                        log.debug( `{color:cyan}${cameras[0]}{color} Iris value changes from controller: ${changeTo.irisValue}`);

                        // console.log("OK PREV WAS ", current);
                        // console.log("OK NEXT IS ", changeTo);

                        cam.Iris.SetValue(changeTo.irisValue);
                        context.cache.set(`iris_updated_from_controller:${cameras[0]}`, true, 350);
                        setTimeout(() => {
                            const newControllerValue = direction == 'right' ? changeTo.endIndex : changeTo.startIndex;
                            context.xTouchMini.setControllerValue(change.controller, newControllerValue);
                            context.cache.set(`controller:${change.controller}`, newControllerValue);
                        });
                        
                        // if (direction == 'right') {
                        //     await cam.Iris.SetValue(ranges[ix + 1].irisValue);
                        //     context.cache.set(`iris_updated_from_controller:${cameras[0]}`, true, 250);
                        //     console.log("[right] SET CONTROLLER TO", ranges[ix + 1].endIndex);
                        //     setTimeout(() => {
                                
                        //         context.xTouchMini.setControllerValue(change.controller, ranges[ix + 1].endIndex);
                        //         context.cache.set(`controller:${change.controller}`, ranges[ix + 1].endIndex);
                        //     })
                        // } else {
                        //     await cam.Iris.SetValue(ranges[ix - 1].irisValue);
                        //     context.cache.set(`iris_updated_from_controller:${cameras[0]}`, true, 250);
                        //     console.log("[left] SET CONTROLLER TO", ranges[ix - 1].startIndex);
                        //     context.xTouchMini.setControllerValue(change.controller, ranges[ix - 1].startIndex);
                        //     context.cache.set(`controller:${change.controller}`, ranges[ix - 1].startIndex);
                        // }



                }
                

                // const ix = controllerRangeList.findIndex(f => change.value >= f.startIndex && 
                //     typeof f.endIndex != 'undefined' &&  change.value < f.endIndex);

                //     clearTimeout(timers[`controller:${change.controller}`]);
                
                //     if (ix != -1) {
                //         if (direction == 'right') {
                //             console.log("SET IRIS TO", controllerRangeList[ix+1]);
                //             console.log("SET CONTROLLER TO", controllerRangeList[ix+1].endIndex);
                //             context.cache.set(`controller:${change.controller}`, change.value);

                //             const controllerV: number = controllerRangeList[ix+1].endIndex as number;


                //             setTimeout(() => {
                //                 context.xTouchMini.setControllerValue(change.controller, controllerV);
                //                // context.cache.set(`controller:${change.controller}`, controllerV);
                //             }, 5);

                //         }
                //     }



               // console.log("listindex", ix);
                // Update controller value in cache so we can detect which way the knob was turned

  //              context.cache.set(`controller:${change.controller}`, change.value);

    //            clearTimeout(timers[`controller:${change.controller}`]);

//                timers[`controller:${change.controller}`] = setTimeout(async () => {
//                    console.log("IRIS", currentIrisValue, irisIndex);
//                     if (direction == 'right') {
//                         if (irisIndex == allIrisValues.length - 1) {
//                             irisIndex = 0;
//                         } else {
//                             irisIndex++;
//                         }
//                     } else {
//                         irisIndex--;
//                     }
//                     //console.log("SET TO", irisIndex * 5);
//                     //context.xTouchMini.setControllerValue(change.controller, irisIndex * 5);
// //                    console.log("SET IRIS TO", irisIndex, '=>', allIrisValues[irisIndex]);
//                     await cam.Iris.SetValue(allIrisValues[irisIndex]);

//                     context.cache.set(`iris_updated_from_controller:${cameras[0]}`, true, 250);


//                     setTimeout(() => {
//                         context.xTouchMini.setControllerValue(change.controller, (irisIndex - 5) * 5);
//                         context.cache.set(`controller:${change.controller}`, (irisIndex - 5) * 5);
//                     }, 5);


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
    } catch (e) {
        log.error(`Error occured here`, e);
        throw e;
    }

}