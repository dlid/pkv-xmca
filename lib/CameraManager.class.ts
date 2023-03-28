import { Camera, CameraConnectionStatus } from './pxw-z190v';
import { differenceInSeconds } from 'date-fns';
import { BehaviorSubject, Observable, skip, Subject } from 'rxjs';
import { LogService, Logger } from './log/logService.class';
import { ConfigurationRoot, CameraConfiguration } from './types/configuration.types';
export class CameraManager {

    private cameras: { [name: string]: Camera } = {};
    private logger: LogService;

    constructor(private config: ConfigurationRoot) {

        this.logger = Logger.getInstance().for('cameraManager');
        const savonaLogger = Logger.getInstance().for('@dlid/savona'); // TODO: Skip this and use a single logger instead

        const cameraConnectionAttempts: { [name: string]: number} = {};
        const cameraConnectionLastMessage: { [name: string]: Date} = {};


        this.logger.info(`Trying to connect ${Object.keys(config.cameras).length} camera(s)`);

        Object.keys(config.cameras).forEach(cameraName => {
            const settings = config.cameras[cameraName];
            
            this.cameras[cameraName] = new Camera(settings.host, settings.username, settings.password, '');

            this.cameras[cameraName].connectionStatus.pipe(skip(1)).subscribe(async s => {
                if (s === CameraConnectionStatus.Connected) {
                    this.logger.info(`"{color:cyan}${cameraName}{color}" - {color:green}Connected!`);
                    delete cameraConnectionAttempts[cameraName];


                } else if (s === CameraConnectionStatus.Disconnected) {
                    this.logger.info(`"{color:cyan}${cameraName}{color}" - {color:yellow}Camera Connection lost`);
                } else if (s === CameraConnectionStatus.Connecting) {

                    if (!cameraConnectionAttempts[cameraName]) {
                        cameraConnectionAttempts[cameraName] = 0;
                    }

                    cameraConnectionAttempts[cameraName] ++;

                    if (cameraConnectionAttempts[cameraName] === 1) {
                        this.logger.info(`"{color:cyan}${cameraName}{color}" - Connecting to camera`);
                        cameraConnectionLastMessage[cameraName] = new Date();
                    } else{
                        const diff = differenceInSeconds(new Date(), cameraConnectionLastMessage[cameraName]);
                        if (diff > 30) {
                            this.logger.info(`"{color:cyan}${cameraName}{color}" - {color:yellow}Still trying to connect`);
                            cameraConnectionLastMessage[cameraName] = new Date();
                        }
                    }
                }
            });

            this.cameras[cameraName].log.subscribe(cameraLogEvent => {
                
                if (cameraLogEvent.level === 'debug') {
                    savonaLogger.debug(`{color:cyan}${cameraName}{color} ${cameraLogEvent.message} {color:dim}(${cameraLogEvent.origin}){color}`);
                } else if (cameraLogEvent.level === 'info') {
                    savonaLogger.info(`{color:cyan}${cameraName}{color} ${cameraLogEvent.message} {color:dim}(${cameraLogEvent.origin}){color}`);
                } else if (cameraLogEvent.level === 'warning'+ ' ' + cameraLogEvent.origin) {
                    savonaLogger.warn(`{color:cyan}${cameraName}{color} ${cameraLogEvent.message} {color:dim}(${cameraLogEvent.origin}){color}`);
                } else if (cameraLogEvent.level === 'error') {
                    savonaLogger.error(`{color:cyan}${cameraName}{color} ${cameraLogEvent.message} {color:dim}(${cameraLogEvent.origin}){color}`);
                }
                

            })
            this.tryConnect(cameraName);
        });



    }

    public async closeAll(): Promise<void> {
        this.logger.info('Disconnecting all cameras');

        return await new Promise(async resolve => {
            Object.keys(this.cameras).forEach(async cameraName => {
                const camera = this.cameras[cameraName];
                await camera.disconnect();
            });
            resolve();
        });

    }

    private tryConnect(cameraName: string): void {
        
        // this.logger.debug(`Trying to connect to camera {color:cyan}${cameraName}`);
        this.cameras[cameraName].connect().then(x => {
            
        }).catch(nej => {
            console.log("error connecting...");
            setTimeout( () => this.tryConnect(cameraName), 5000)
        });
    }

    public getCameraNames(): string[] {
        return Object.keys(this.config.cameras);
    }

    private get cameraConfigAsArray(): { name: string, config: CameraConfiguration}[] {
        return Object.keys(this.config.cameras).map(c => { return { name: c, config: this.config.cameras[c]} });
    }

    public getCamera(cameraName: string): Camera {
        return this.cameras[cameraName];
    }

    public getConfiguration(cameraName: string): CameraConfiguration {
        return this.config.cameras[cameraName];
    }

    public getCameraControllers(): { cameraName: string, controllers: number[]  }[] {

        return this.cameraConfigAsArray.filter(c => c.config.iris?.controller).map(c => {
            return { cameraName: c.name, controllers: [c.config?.iris?.controller as number] } 
        });

    }

    /**
     * Get any cameras that have a configuration for a given controller
     * @returns Array of camera names
     */
    public getCamerasForController(controller: number, channel?: number): string[] {
        const configArray = this.cameraConfigAsArray;
        const cameras = configArray.filter(c => ((!channel || !c.config.iris?.channel) || (c.config.iris?.channel == channel )) && c.config.iris?.controller === controller).map(c => c.name);
        return cameras;
    }

    public startTryingToConnect(): void {

    }

}