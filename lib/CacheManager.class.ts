
interface CachedValue {
    value: any;
    expires: number;
}

export class CacheManager {

    private _cache: { [key: string]: CachedValue} = {};

    public set(key: string, value: any, ttl = -1) {
        this._cache[key] = {
            expires: ttl != -1 ? (new Date().getTime()) + ttl : -1,
            value
        };
//        console.log(`cache.set`, key, value);
    }

    public get<T>(key: string, defaultValue: T | null = null): T | null {
        if (key in this._cache) {
            if (this._cache[key].expires != -1 && (new Date()).getTime() > this._cache[key].expires) {
                delete this._cache[key];
                return defaultValue;
            }
            return this._cache[key].value as T;
        }
        return defaultValue;
    }

}