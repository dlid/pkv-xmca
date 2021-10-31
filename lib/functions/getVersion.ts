import { readFileSync } from "fs";
import { join } from "path";

export function getVersion(): string {

    try {
        const packageFileContent = readFileSync( join(__dirname, '../../package.json')).toString();
        const pckg = JSON.parse(packageFileContent);
        if (pckg.version) {
            return pckg.version;
        }
    } catch(e) {}

    return '?.?.?';

}