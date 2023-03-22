import { PkvContext } from "../../functions/startup.function";
import { onCameraIrisAutoChanged } from "./onCameraIrisAutoChanged";
import { onCameraIrisValueChanged } from "./onCameraIrisValueChanged";

export interface IrisControllerRange {
    startIndex: number;
    endIndex: number;
    irisValue: number;
}

/**
 * When connection to a camera is established.
 * 
 * Event occurs as soon as status to a camera is changed to connected.
 * This can occur multiple times as camera can be turned off and on while these scripts are running
 * @param context The PkvContext with access to XTouch and CameraManager
 * @param cameraName The camera that was connected. Name is from config file
 */
export async function onCameraConnected(context: PkvContext, cameraName: string): Promise<void> {

    // Fetch the Camera by name
    const cam = context.cameraManager.getCamera(cameraName);

    // Call eventhandler to read current iris status
    await onCameraIrisAutoChanged(context, cameraName);

    var irisValues = await cam.Iris.GetIrisValues();
    var irisValue = await cam.Iris.GetValue();

    irisValues.reverse();

    context.cache.set(`camera.irisvalues:${cameraName}`, irisValues);

    const controllerSteps = 127 / irisValues.length;
    const step = Math.floor(controllerSteps);
    const controllerRangeList = [];
    let range: IrisControllerRange = {
        startIndex: 0,
        endIndex: -1,
        irisValue: -1
    };

    for (let i = 0; i <= 127; i++) {
        if (i % step == 0) {
            if (range.endIndex == -1 && range.startIndex != i) {
                range.endIndex = i;
                controllerRangeList.push( Object.assign({}, range) );
                range = {startIndex: i + 1, endIndex: -1, irisValue: -1 };
            }
        }
    }

    controllerRangeList[controllerRangeList.length - 1].endIndex = 127;
    
    controllerRangeList.forEach((v, i) => {
        v.irisValue = irisValues[i];
    })

    

    context.cache.set(`camera.controller.range:${cameraName}`, controllerRangeList);

    // console.log(`/** Camera '${cameraName}' Connected`);
    // console.log(`  *  Iris value: ${irisValue}`);

    if (controllerRangeList) {
        const config = context.cameraManager.getConfiguration(cameraName);

        // context.cache.set(`controller:${irisControllerId}`, index);
//        console.log("SET CONTROLLER", rangeIndex, controllerRangeList[rangeIndex]);

  //    console.log(controllerRangeList)  

        if (config.iris?.controller) {
            const rangeIndex = controllerRangeList?.findIndex(r => r.irisValue == irisValue) ;
          //  console.log(`  *  Setting Controller[${config.iris?.controller}]: ${controllerRangeList[rangeIndex].endIndex}`);
            context.xTouchMini.setControllerValue( config.iris?.controller, controllerRangeList[rangeIndex].endIndex);
            context.cache.set(`controller:${config.iris?.controller}`, controllerRangeList[rangeIndex].endIndex);
        }

    }


    
}


