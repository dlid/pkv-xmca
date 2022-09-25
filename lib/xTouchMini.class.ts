import { differenceInSeconds } from 'date-fns';
import * as easymidi from 'easymidi';
import { Observable, Subject } from 'rxjs';
import { Logger, LogService } from './log/logService.class';

export interface NotChangeEvent {
    channel: easymidi.Channel;
    note: number;
    velocity: number;
    type: 'on' | 'off';
}

export class XTouchMini {

    private input?: easymidi.Input;
    private output?: easymidi.Output;
    private readonly deviceName: string = 'X-TOUCH MINI';
    private connectionCheckTimer?: NodeJS.Timer;
    private waitForDevicePromise?: Promise<void> | null;
    private connectedSubject: Subject<boolean> = new Subject<boolean>();
    private isDeviceConnected = false;
    private log: LogService;
    private controllerChangeSubject = new Subject<easymidi.ControlChange>();
    private noteChangeSubject = new Subject<NotChangeEvent>();
    private loaders: { [key: number]: { timer: NodeJS.Timer, value: number, delay: number, direction: number } } = {};

    private connectionAttempt = 0;

    constructor() {
        this.log = Logger.getInstance().for('xTouchMini');
    }
    
    public on(event: 'connecting' | 'connect' | 'disconnect', callbak: () => void) {

    }

    public get controllerChange(): Observable<easymidi.ControlChange> {
        return this.controllerChangeSubject.asObservable();
    }

    public get noteChange(): Observable<NotChangeEvent> {
        return this.noteChangeSubject.asObservable();
    }

    

    public get isConnected(): boolean {
        return this.isDeviceConnected;
    }

    private checkConnection(): void {
        if (!this.isDeviceAvailable()) {
            if (this.connectionCheckTimer) {
                clearInterval(this.connectionCheckTimer);
            }
            this.log.info(`"{color:cyan}${this.deviceName}{color}" Connection Lost`);
            this.isDeviceConnected = false;
            this.connectedSubject.next(false);
            this.connect();
        }
    }


    private isDeviceAvailable(): boolean {
        var outputs = easymidi.getOutputs() as string[];
        if (outputs.includes(this.deviceName)) {
            return true;
        }
        return false;
    }

    public close(): void {
        if (this.isConnected) {
            this.log.debug(`Closing MIDI connections`);
            this.input?.close();
            this.output?.close();
        }
    }

    private async waitForDevice(): Promise<void> {

        const waitStart = new Date();
        let lastMessageSec = 0;
        if (this.waitForDevicePromise) {
            return this.waitForDevicePromise;
        }

        let resolveFn: () => void;

        const tick = () => {

            const diff = differenceInSeconds(new Date(), waitStart);

            if (diff > 0) {
                if ((diff % 30) === 0 && lastMessageSec !== diff) {
                    this.log.debug(`Still waiting for MIDI Device "{color:cyan}${this.deviceName}{color}"`);
                    lastMessageSec = diff;
                }
            }

            if (this.isDeviceAvailable()) {
                resolveFn();
                this.waitForDevicePromise = null;
            } else {
                setTimeout(() => tick(), 250);
            }
        }

        this.waitForDevicePromise = new Promise<void>((resolve) => {
            resolveFn = resolve;
            setTimeout(() => tick(), 250);
        });


        return this.waitForDevicePromise;
    }

    public startControllerLoadingAnimation(controller: number): void {
        if (this.loaders[controller]) {
            clearTimeout(this.loaders[controller].timer);
            delete this.loaders[controller];
        }

        let delay = 5;

        this.loaders[controller] = {
            timer: setTimeout( () => this.animationTick(controller), delay),
            delay: delay,
            value: 0,
            direction: 1
        };
    }

    public stopControllerLoadingAnimation(controller: number, ): void {
        if (this.loaders[controller]) {
            clearTimeout(this.loaders[controller].timer);
            delete this.loaders[controller];
        }
    }

    public setControllerValue(controller: number, value: number): void {
        this.output?.send('cc', {
            controller: controller,
            value: value,
            channel: 10
        });
    }

    public setNoteValue(note: number, velocity: number, channel: easymidi.Channel = 0): void {
        this.output?.send('noteon', {
            channel: channel,
            note: note,
            velocity: velocity
        });
        
    }


    private animationTick(controller: number): void {
        if (this.isConnected) {
            this.output?.send('cc', {
                controller: controller,
                value: this.loaders[controller].value,
                channel: 10
            });

            // Next value.

            this.loaders[controller].value += this.loaders[controller].direction;

            if (this.loaders[controller].direction == 1 && this.loaders[controller].value == 127) {
                this.loaders[controller].direction = -1;
            } else if (this.loaders[controller].direction == -1 && this.loaders[controller].value == 0) {
                this.loaders[controller].direction = 1;
            }

            this.loaders[controller].timer = setTimeout( () => this.animationTick(controller), this.loaders[controller].delay);

        } else {

        }
    }


    private async connect(): Promise<void> {


        return new Promise(async resolve => {

            try {

                //if (this.connectionAttempt === 0) {

                    this.log.info(`"{color:cyan}${this.deviceName}{color}" - {color:yellow}Waiting for MIDI Device`);
              //  }
                await this.waitForDevice();

                this.output = new easymidi.Output(this.deviceName);
                this.input = new easymidi.Input(this.deviceName);

                this.log.info(`"{color:cyan}${this.deviceName}{color}" - {color:green}Connected{color} to MIDI device`);

                this.connectionCheckTimer = setInterval(() => this.checkConnection(), 250);
                this.isDeviceConnected = true;
                this.connectedSubject.next(true);
                this.input.on('cc', (msg) => {
                    this.log.debug(`INPUT '{color:magenta}cc{color}' channel: ${msg.channel} controller: ${msg.controller} value: ${msg.value}`);
                    this.controllerChangeSubject.next(msg);
                });

                this.input.on('noteon', (msg) => {
                    this.noteChangeSubject.next({
                        type: 'on',
                        channel: msg.channel,
                        velocity: msg.velocity,
                        note: msg.note
                    });
                    this.log.debug(`INPUT '{color:green}noteon{color}' channel: ${msg.channel} note: {color:cyan}${msg.note}{color} velocity: {color:yellow}${msg.velocity}{color}`);
                });
                this.input.on('noteoff', (msg) => {
                    this.noteChangeSubject.next({
                        type: 'off',
                        channel: msg.channel,
                        velocity: msg.velocity,
                        note: msg.note
                    });
                    this.log.debug(`INPUT '{color:yellow}noteoff{color}' channel: ${msg.channel} note: {color:cyan}${msg.note}{color} velocity: {color:yellow}${msg.velocity}{color}`);
                });

                // this.output.send('noteon', {
                //     velocity: 2 // BLINK BUTTON
                // } as easymidi.Note)

                // this.output.send('noteon', {
                //     velocity: 1 //  BUTTON LIGHT ON
                // } as easymidi.Note)


            } catch(e: any) {
                this.connectionAttempt++;
                await this.connect();
            }

        });


    }   

    public start(): Observable<boolean> {
        this.connect();
        return this.connectedSubject.asObservable();

    }

}