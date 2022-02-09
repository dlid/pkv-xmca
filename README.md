
python 3.+
npm install windows-build-tools (npm)




# pkv-xmca

Small utility for camera control using XTouch mini

Connects to PXW-Z190V cameras using @dlid/savona and binds them to a Behringer XTouch Mini device.

Can currently bind IRIS control to a Controller (knob)

Note: Temporarily using ../ file version of dlid/savona during development

# Installation

You probably want to install this tool globally:

    npm install @dlid/pkv-xmca -g

# Basic use

Copy the included config template file (pkv-xmca.template.json) and rename it to `pkv-xmca.json`

Update the configuration file with the IP Addresses to your cameras, and the Controllers to bind the IRIS functionality to.

Run pkv-xmca and point toward your configuration file:

    pkv-xmca ./pkv-xmca.json







# Thank you's

- @dlid/savona - is used to talk to the cameras
- [commander](https://www.npmjs.com/package/commander) - is used for parsing command line arguments
- [date-fns](https://www.npmjs.com/package/date-fns) - is used for date formatting in logs
- [easymidi](https://www.npmjs.com/package/easymidi) - is used to talk to X-Touch MINI
- [platform-folders](https://www.npmjs.com/package/platform-folders) - is used when loading configuration files
- [rxjs](https://www.npmjs.com/package/rxjs) - is used for reacting programming pattern
- [typescript](https://www.npmjs.com/package/typescript) - is used for development and javascript transpilation
