import { CameraManager } from './../CameraManager.class';
import { Logger } from './../log/logService.class';
import { ConfigurationRoot } from './../types/configuration.types';
import { XTouchMini } from "../xTouchMini.class";
import { CameraConnectionStatus } from '@dlid/savona';


async function run(){
    // Do some asynchronous stuff here, e.g.
    await new Promise(resolve => setTimeout(resolve, 1000));
}


export interface PkvContext {
    xTouchMini: XTouchMini;
    cameraManager: CameraManager;
}

function exitHandler(options: { exit?:  boolean, cleanup?: boolean, xTouch?: XTouchMini, cameraManager?: CameraManager }, exitCode: number) {

    const log = Logger.getInstance().for('exitHandler');

    if (options.cleanup) log.info('Received cleanup flag');
    if (options.exit) log.info('Received exit flag');
    if ( options.cleanup && options.xTouch?.isConnected) {
        if (options.cleanup) log.info('Cleaning up - MIDI Connection');
        options.xTouch.close();
    }

    if ( options.cleanup && options.cameraManager) {
        if (options.cleanup) log.info('Cleaning up - Cameras');
        options.cameraManager.closeAll().then(ok => {
            console.log("Cameras closed");
        })
    }

    // if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

export function startup(config: ConfigurationRoot): Promise<PkvContext> {

    let first = true;
    let firstXtouchConnection = true;
    let logger = Logger.getInstance().for('startup');

    return new Promise<PkvContext>(resolve => {
        Promise.resolve().then(function resolver(): Promise<void> {

            if (first) {
                first = false;
                
                process.stdin.resume(); //so the program will not close instantly

                
                
                //do something when app is closing
              

                const xTouch = new XTouchMini();
                const cameraManager = new CameraManager(config);

                process.on('exit', exitHandler.bind(null,{cleanup:true, xTouch, cameraManager}));

                process.on('SIGINT', exitHandler.bind(null, {exit:true, xTouch, cameraManager}));


                xTouch.start().subscribe((isConnected: boolean) => {
                    

                    if (isConnected) {
                        
                        

                        // Make them controllers spin while not connected
                        const cameraControllers = cameraManager.getCameraControllers();

                        cameraManager.getCameraNames().forEach(name => {
                            const camera = cameraManager.getCamera(name);
                            const cameraConfig = cameraManager.getConfiguration(name);

                            if (camera.isConnected === false) {

                                xTouch.startControllerLoadingAnimation(cameraConfig.iris?.controller as number);

                            }
                            if (firstXtouchConnection) {
                                camera.connectionStatus.subscribe(ja => {
                                    if (ja === CameraConnectionStatus.Disconnected ) {
                                        if (cameraConfig.iris?.controller) {
                                            logger.debug(`Camera ${name} not connected. Starting waiting animation for controller ${cameraConfig.iris?.controller}`);
                                            xTouch.startControllerLoadingAnimation(cameraConfig.iris?.controller);
                                        }
                                    } else if (ja === CameraConnectionStatus.Connected) {
                                        if (cameraConfig.iris?.controller) {
                                            logger.debug(`Camera ${name} is connected`);
                                            xTouch.stopControllerLoadingAnimation(cameraConfig.iris?.controller);
                                        }
                                    }

                                })
                            
                                cameraManager.startTryingToConnect();

                            }

                        })

                        firstXtouchConnection = false;
                    
                        // Let camera manager start trying to connect to cameras
                        

                        first = false;
                        resolve({
                            xTouchMini: xTouch,
                            cameraManager: cameraManager
                        });
                    }
                });

            }

            return run()
            .then(run)
            .then(resolver)
            .catch(x => {
                console.log("ERROR 2", x);
            })

        }).catch((error) => {
            console.log("Error: " + error);
        });

    })

}