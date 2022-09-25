import { PkvContext } from "../../functions/startup.function";
import { onCameraIrisValueChanged } from "./onCameraIrisValueChanged";

/**
 * When camera auto iris setting is changed. Also called when camera is connected
 * 
 * A button on the xTouch mini will blink in case the camera iris is set to Automatic.
 * Usually, we want manual control from the XTouch Mini Interface so the blinking button will warn the user that's it's set to Auto
 */
export async function onCameraIrisAutoChanged(context: PkvContext, cameraName: string, setting?: 'Automatic' | 'Manual'): Promise<void> {

    const cam = context.cameraManager.getCamera(cameraName);

    // Get current value from camera if it's not provided in parameters
    if (!setting) {
        setting = await cam.Iris.GetSetting();
    }

    // Get the button that should blink if the iris is set to Automatic
    const xTouchButtonId = context.cameraManager.getConfiguration(cameraName).iris?.settingBlinkNote;
    
    if (typeof xTouchButtonId !== 'undefined') {
        if (setting == 'Automatic') {
            context.xTouchMini.setNoteValue(xTouchButtonId, 2);
        } else {
            context.xTouchMini.setNoteValue(xTouchButtonId, 0);

            // Not sure if this is needed... but it may be needed to make sure controller is updated
            await onCameraIrisValueChanged(context, cameraName);

        }
    }

}
