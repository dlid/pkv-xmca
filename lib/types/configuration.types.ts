
export interface ConfigurationRoot {
    cameras: {  [id: string]: CameraConfiguration }
}

export interface CameraConfiguration {
    host: string;
    username: string;
    password: string;
    iris?: {
        channel?: number;
        controller: number;
    }
}