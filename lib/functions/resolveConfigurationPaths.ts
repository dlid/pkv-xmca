import { join, resolve } from "path";
import getPath from 'platform-folders';

/**
 * Returns a number of possible config file locations for the given filename
 */
export function resolveConfigurationPaths(filename: string): string[] {
    return [
        process.env.XMCA_FILENAME || '',
        process.env.XMCA_FILENAME ? join(process.env.XMCA_FILENAME, filename) : '' ,
        resolve(filename),
        getPath('home') ? join(getPath('home') as string, filename) : '',
        getPath('documents') ? join(getPath('documents') as string, filename) : '',
        join( __dirname, filename )
    ].filter(v => v);
}
