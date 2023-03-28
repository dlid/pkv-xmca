# pkv-xmca

Small utility for PXW-Z190V Camera control using XTouch mini

Connects to PXW-Z190V cameras using @dlid/savona and binds them to a Behringer XTouch Mini device.

# Requires 

- Node.js 16.19.1


http://192.168.0.81/
# Installation 

- Install NodeJS 16.17.1+ (Including Build Tools)
- Run `npm install` in repository folder
- Run `node ./ [config.json]` in repository folder

# Development

- Recommended tools
  - [Cmder]([Cmder](https://cmder.app/)) - a better Windows terminal
  - [VSCode](https://code.visualstudio.com/) - as editor
- Run `npm start` in repository folder to watch TypeScript file changes and automatically build
- Run `node ./ [config.json]` in repository folder to run the latest code

# Basic use

Copy the included config template file (pkv-xmca.template.json) and rename it to `pkv-xmca.json`

Update the configuration file with the IP Addresses to your cameras, and the Controllers to bind the IRIS functionality to.

Run pkv-xmca and point toward your configuration file:

    pkv-xmca ./pkv-xmca.json


# Thank you's

- [commander](https://www.npmjs.com/package/commander) - is used for parsing command line arguments
- [date-fns](https://www.npmjs.com/package/date-fns) - is used for date formatting in logs
- [easymidi](https://www.npmjs.com/package/easymidi) - is used to talk to X-Touch MINI
- [platform-folders](https://www.npmjs.com/package/platform-folders) - is used when loading configuration files
- [rxjs](https://www.npmjs.com/package/rxjs) - is used for reacting programming pattern
- [typescript](https://www.npmjs.com/package/typescript) - is used for development and javascript transpilation
