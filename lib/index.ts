import { CameraConnectionStatus } from './pxw-z190v';
import { startup } from './functions/startup.function';
import { onCameraConnected } from './eventHandlers/camera/onCameraConnected';
import { filter } from 'rxjs';
import { onCameraIrisAutoChanged } from './eventHandlers/camera/onCameraIrisAutoChanged';
import { onCameraIrisValueChanged } from './eventHandlers/camera/onCameraIrisValueChanged';
import { onControllerChange } from './eventHandlers/xTouchMini/onControllerChange';
import { onButtonDown } from './eventHandlers/xTouchMini/onButtonDown';
import applicationStart from './functions/applicationStart';

// Parse Command Line Arguments and load configuration
const config = applicationStart();

// const tmpLastSetValue: { [key: string]: { value: number, time: Date }} = {}; - use for something??

(async () => {

    // Startup will init connections cameras and xTouchMini and make it available in the PkvContext
    await startup(config).then(context => {
        
        // Subscribe to XTouch Mini Controller change event - when an XtouchMini knob is used
        context.xTouchMini.controllerChange.subscribe(async change => await onControllerChange(context, change));        
        
        // Subscribe to XTouch Mini Note On Event - when an XTouchMini button is pressed down
        context.xTouchMini.noteChange
            .pipe(filter(n => n.type === 'on')) // on = Button pressed down, off = released
            .subscribe(async change => await onButtonDown(context, change))

        // Subscribe to camera events for each camera
        for (const cameraName of context.cameraManager.getCameraNames()) {

            const cam = context.cameraManager.getCamera(cameraName);

            // Subscribe to Camera Connected change 
            cam.connectionStatus
                .pipe(filter(status => status == CameraConnectionStatus.Connected))
                .subscribe(() => onCameraConnected(context, cameraName) );

            // Subscribe to Camera Iris auto/manual changes
            cam.Iris.onSettingMethodChanged(async setting => onCameraIrisAutoChanged(context, cameraName, setting));
            
            // Subcribe to Cmaera Iris Value changes
            cam.Iris.addChangeHandler(value => onCameraIrisValueChanged(context, cameraName, value.Value) );

        }

    })
})();
