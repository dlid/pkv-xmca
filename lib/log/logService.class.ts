import { format } from "date-fns";

export class LogService {

    public logLevel: 'info' | 'debug' = 'info';

    private colors: { [key: string]: string } = {
        'reset': '\x1b[0m',
        'black': "\x1b[30m",
        'red': "\x1b[31m",
        'green': "\x1b[32m",
        'yellow': "\x1b[33m",
        'blue': "\x1b[34m",
        'magenta': "\x1b[35m",
        'cyan': "\x1b[36m",
        'white': "\x1b[37m",
        'dim': "\x1b[2m",
        "dimred": "\x1b[2m\x1b[31m",
        "dimblue": "\x1b[2m\x1b[34m",
        "brightcyan": "\x1b[2m\x1b[36m"
    }

//     Reset = "\x1b[0m"
// Bright = "\x1b[1m"
// Dim = "\x1b[2m"
// Underscore = "\x1b[4m"
// Blink = "\x1b[5m"
// Reverse = "\x1b[7m"
// Hidden = "\x1b[8m"

    constructor(private source: string = 'main') {}

    public debug(text: string, data?: any): void {

        if (this.logLevel === 'info') {
            return;
        }

        const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SS');

        console.log( `[DEBUG ] - ${date} - [${this.source}] - ${this.bepaint(text)}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    public info(text: string, data?: any): void {

        const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SS');

        console.log( this.bepaint(`{color:brightcyan}[INFO  ]{color} - ${date} - [${this.source}] - ${text}`))
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    public warn(text: string, data?: any): void {

        const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SS');

        console.log( `[WARN  ] - ${date} - [${this.source}] - ${this.bepaint(text)}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    public error(text: string, data?: any): void {

        const date = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SS');

        console.log( this.bepaint(`{color:red}[ERROR]{color} - ${date} - [${this.source}] - ${text}`));
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    public for(name: string): LogService {
        const newLogger = new LogService(name);
        newLogger.logLevel = this.logLevel;
        return newLogger;
    }
    

    bepaint(value: string, stripAnsi = false): string {
        let match: RegExpMatchArray | null;
        let newValue: string = value;
        let coloredTexts: string[] = [];
        do {
            match = newValue.match(/\{color:([a-zA-Z\-]+)\}(.*?)(\{color\}|$)/);
            if (match) {
                newValue = newValue.replace(match[0], `_%C${coloredTexts.length}%_`);
                
                if (this.colors[match[1]]) {
                    coloredTexts.push( ( stripAnsi ? '' : this.colors[match[1]]) + match[2] + ( stripAnsi ? '' : this.colors['reset']) );
                } else {
                    coloredTexts.push(match[2]);
                }
            }
        } while(match);

        coloredTexts.forEach((text: string, i: number) => {
            newValue = newValue.replace(`_%C${i}%_`,  text);
        })

        return newValue;
    }

}


// Singleton class we have added below.
export class Logger {
    // Use the `Logger` type
    private static instance: LogService
    // Use a private constructor
    private constructor() {}
    // Ensure that there is only one instance created
    public static getInstance(): LogService {
        if (!Logger.instance) {
            Logger.instance = new LogService()
        }        
        return Logger.instance
    }
}