import { PkvContext } from "../../functions/startup.function";
import { Logger } from "../../log/logService.class";
import { onCameraIrisValueChanged } from "../camera/onCameraIrisValueChanged";

/**
 * When a button is pressed that should control the auto/manual setting for a camera
 * 
 * Called from 'onButtonDown' if Button (Note) is linked to camera setting camera.iris.setManualNote
 * 
 * Configs:
 *  - camera.iris.setManualNote - id of button that is pressed
 * 
 * @see onButtonDown
 */
export default async function onButtonDown_ToggleIrisAuto(context: PkvContext, cameraName: string): Promise<void> {
    const logger = Logger.getInstance().for('onButtonDown_ToggleIrisAuto');
    const cam = context.cameraManager.getCamera(cameraName);
    const currentSetting = await cam.Iris.GetSetting();

    if (currentSetting == 'Automatic') {
        logger.info(`cameras.${cameraName} Setting Iris to Manual`);
        await cam.Iris.SetManual();
        
        // Make sure we fetch the current iris value and update the controller etc.
        await onCameraIrisValueChanged(context, cameraName);
    } 
    else
    {
        logger.info(`cameras.${cameraName} Setting Iris to Automatic`);
        await cam.Iris.SetAuto();
    }

}