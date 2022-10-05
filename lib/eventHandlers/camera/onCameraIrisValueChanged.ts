import { PkvContext } from "../../functions/startup.function";

let ts: NodeJS.Timeout;

/**
 * When camera iris value is changed. Also called from onCameraConnected
 * 
 * Here we should make sure the XTouch Mini Controller (knob) shows the correct indicator value (if possible)
 */
export async function onCameraIrisValueChanged(context: PkvContext, cameraName: string, value?: number): Promise<void> {

    const cam = context.cameraManager.getCamera(cameraName);

    const updatedFromController = context.cache.get<boolean>(`iris_updated_from_controller:${cameraName}`, false);

    if (updatedFromController == true) {
//        console.log("Received iris updated value. Ignoring since it's probably from conttroller");
        return;
    }

    // Read iris value from camera if it's not provided in parameter
    let irisNumericValue = typeof value !== 'undefined' ? value : await cam.Iris.GetValue();

    // Get the XTouch Controller (knob) id and update its value to match that of the iris value
    const irisControllerId = context.cameraManager.getConfiguration(cameraName).iris?.controller;
    if (irisControllerId) {                    

        let allValues: number[] =  context.cache.get<number[]>(`camera.irisvalues:${cameraName}`, []) ?? await cam.Iris.GetIrisValues();

        if (allValues.length == 0) {
            allValues = await cam.Iris.GetIrisValues();
        }

        var index = allValues.indexOf(irisNumericValue);
        
        // context.cache.set(`controller:${irisControllerId}`, index);
        

        const controllerIndex = (index - 5) * 5;
  //      console.log("Iris value index", irisNumericValue, index);
//        console.log("Iris updated. Set controller to ", controllerIndex);
        // const index = await cam.Iris.GetValue();
        context.xTouchMini.setControllerValue(irisControllerId, controllerIndex);
        context.cache.set(`controller:${irisControllerId}`, controllerIndex);


    }


}
