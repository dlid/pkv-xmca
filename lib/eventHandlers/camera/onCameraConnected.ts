import { PkvContext } from "../../functions/startup.function";
import { onCameraIrisAutoChanged } from "./onCameraIrisAutoChanged";
import { onCameraIrisValueChanged } from "./onCameraIrisValueChanged";

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

    // Call event handler to read current iris value
    await onCameraIrisValueChanged(context, cameraName)

}


