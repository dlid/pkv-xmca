import { PkvContext } from "../../functions/startup.function";

/**
 * When camera iris value is changed. Also called from onCameraConnected
 * 
 * Here we should make sure the XTouch Mini Controller (knob) shows the correct indicator value (if possible)
 */
export async function onCameraIrisValueChanged(context: PkvContext, cameraName: string, value?: number): Promise<void> {

    const cam = context.cameraManager.getCamera(cameraName);

    // Read iris value from camera if it's not provided in parameter
    let irisNumericValue = typeof value !== 'undefined' ? value : await cam.Iris.GetValue();

    // Get the XTouch Controller (knob) id and update its value to match that of the iris value
    const irisControllerId = context.cameraManager.getConfiguration(cameraName).iris?.controller;
    if (irisControllerId) {                    

        var allValues = await cam.Iris.GetIrisValues(); // TODO: Cache this when camera is connected perhaps?
        var index = allValues.indexOf(irisNumericValue);
        
        context.xTouchMini.setControllerValue(irisControllerId, index)
    }


}
