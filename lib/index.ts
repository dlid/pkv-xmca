import { Logger } from './log/logService.class';
import { ConfigurationRoot } from './types/configuration.types';
import { Camera } from '@dlid/savona';
import { loadConfiguration } from './functions/loadSettings.function';
import { startup } from './functions/startup.function';
import { Argument, Command  } from 'commander';
import { join, resolve } from 'path';


// Use commander to parse the filename, and open up for other options in the future
const program = new Command();
let configurationFile: string  = './pkv-xtouch.json';
let config: ConfigurationRoot | undefined;
const logger = Logger.getInstance();


program.addArgument(new Argument('[configFile]', 'Path to JSON file containing configuration').default(configurationFile))
    .option('-v, --verbose', 'Extended logging output')
    .action((configFile: string) => {
        configurationFile = configFile;
    })
    .parse();

const configFileLocations = [
    resolve(configurationFile),
    join( __dirname, configurationFile )
];

const options = program.opts();
if (options.verbose === true) {
    logger.logLevel = 'debug';
}



logger.debug(`Loading configuration file`);

for (let file of configFileLocations) {
    config = loadConfiguration(file);
    if (config) {
        break;
    }
}


if (!config) {
    console.log("Configuration file was not found");
    process.exit(13); 
}

const cameras = {
    'Camera1': new Camera("192.168.0.81", "x", "x", ""),
    'Camera2': new Camera("192.168.0.82", "x", "x", ""),
    'Camera3': new Camera("192.168.0.83", "x", "x", "")
};


//const configurationFileLocations

//loadConfiguration()

(async () => {
    
    

    await startup(config).then(context => {
        // We have the camera manager and we have a connection to the XTouchMini.

        context.xTouchMini.controllerChange.subscribe(change => {
            
            const cameras = context.cameraManager.getCamerasForController(change.controller, change.channel);

            if (cameras.length === 1) {
                
                const cam = context.cameraManager.getCamera(cameras[0]);
                const settings = context.cameraManager.getConfiguration(cameras[0]);

                if (settings.iris?.controller == change.controller) {
                    
                    if (cam.isConnected) {

                    } else {
                        logger.info(`"{color:cyan}${cameras[0]}{color}" (${cam.host}) - is {color:yellow}not connected`);
                    }
                }

            }
            

        })
        
        

    })

})();




// Bind camera 1 IRIS to knob 1

// När man sätter "cc" (control changed) så verkar det gå från 0 -127
//


// Try to connect...


// async function run(){
//     // Do some asynchronous stuff here, e.g.
//     await new Promise(resolve => setTimeout(resolve, 1000));
// }

// let first = true;

// Promise.resolve().then(function resolver(): Promise<void> {

//     if (first) {
//         first = false;
        
//         const xTouch = new XTouchMini();
//         const cameraManager = new CameraManager();

//         xTouch.start().subscribe(isConnected => {
//             if (isConnected) {
//                 console.log("Ok, connected");
//             } else {
//                 console.log("not connected")
//             }
//         });

//     }

//     return run()
//     .then(run)
//     .then(resolver);

// }).catch((error) => {
//     console.log("Error: " + error);
// });




// xTouch.on('connect', () => {
//     console.log("CONNECTED");
// });

// xTouch.on('disconnect', () => {
//     console.log("DISCONNECTED");
// });

// (async () => {
    
//     console.log(1);
//     await xTouch.start();
//     console.log(2);


// })();


// xTouch.start().then(x => {
//     console.log("ja");
// }).catch(x => {
//     console.log("err");
// })


// do {
    
//     try {
//         output = new easymidi.Output('X-TOUCH MINI');
//     } catch (e) {
//         console.log("COuld not connect to xtouch");
//     }


// } while (true);



// try {
//     output = new easymidi.Output('X-TOUCH MINI');

// } catch (e) {
//     console.log("COuld not connect to xtouch");
// }

// process.exit(0)



// var input = new easymidi.Input('X-TOUCH MINI');


// let i = 0;
// let direction = 1;

// // output.send('noteon', {
// //   controller: 8,
// //   value: 127,
// //   channel: 10
// // });

// function next() {

//   output.send('cc', {
//     controller: 1,
//     value: i,
//     channel: 10
//   });

//   output.send('cc', {
//     controller: 2,
//     value: i,
//     channel: 10
//   });

//   i+=direction;

//   if (direction == 1 && i == 127) {
//     direction = -1;
//   } else if (direction == -1 && i == 0) {
//     direction = 1;
//   }

//   setTimeout(() => next(), 10);

// }


// next();


// output.send('cc', {
//   controller: 1,
//   value: 13,
//   channel: 10
// });





// input.on('noteon', function (msg: any) {
//   // do something with msg
//   console.log("on", msg);
// });

// input.on('change', function (msg: any) {
//     // do something with msg
//     console.log("controllerChange", msg);
//   });



//   input.on('noteoff', (msg: any) => console.log('noteoff', msg.note, msg.velocity, msg.channel));

//   input.on('noteon', (msg: any) => console.log('noteon', msg.note, msg.velocity, msg.channel));
  
// //  input.on('poly aftertouch', msg => console.log('poly aftertouch', msg.note, msg.pressure, msg.channel));
  
//   let changed: { [key: string]: { timer: NodeJS.Timeout, value: number, controller: number }} = {};
//   let waitDelay = 250;

//   input.on('cc', (msg: any) => {

//     const controller = msg?.controller as string;

//     if (!changed[controller]) {
//       changed[controller] = {
//         timer: setTimeout(() => setIris(changed[controller]), waitDelay),
//         value: msg.value,
//         controller: msg?.controller as number
//       }
//     } else {
//       clearTimeout(changed[msg.controller].timer);
//       changed[msg.controller].value = msg.value;
//       changed[msg.controller].timer = setTimeout(() => setIris(changed[msg.controller]), waitDelay);
//     }


//   });


//   function setIris(o: { timer: NodeJS.Timeout, value: number, controller: number }) {


//     console.log("UPDATE CAMERA " + o.controller + " to " + o.value);
//   }
  
  // input.on('program', msg => console.log('program', msg.number, msg.channel));
  
  // input.on('channel aftertouch', msg => console.log('channel aftertouch', msg.pressure, msg.channel));
  
  // input.on('pitch', msg => console.log('pitch', msg.value, msg.channel));
  
  // input.on('position', msg => console.log('position', msg.value));
  
  // input.on('select', msg => console.log('select', msg.song));
  
  // input.on('clock', () => console.log('clock'));
  
  // input.on('start', () => console.log('start'))
  
  // input.on('continue', () => console.log('continue'));
  
  // input.on('stop', () => console.log('stop'));
  
  // input.on('reset', () => console.log('reset'));
  


// console.log(input.eventNames());
