import { ASPComServerModel } from './aspcom-server-model';
import { Logger } from 'util/logger';

const logger = new Logger('webserversettingssync');

export class ASPComSettingsStore {
    static cache: Map<string, any> = new Map();
    static hydrate(data: { [key: string]: any }) {
        const keys = Object.keys(data);
        keys.forEach((key) => {
            this.cache.set(key, data[key]);
        });
    }

    static async load<T = any>(key: string): Promise<T> {
        if (this.cache.has(key)) {
            await Promise.resolve();
            return this.cache.get(key);
        }
        try {
            const results = await ASPComServerModel.loadSetting(key);
            this.cache.set(key, results.value);
            return results.value;
        } catch (error) {
            logger.error(`Error loading ${key} from remote webserver`, error);
            throw error;
        }
    }

    static async save<TValue>(key: string, value: TValue): Promise<void> {
        try {
            await ASPComServerModel.saveSetting(key, value);
            this.cache.set(key, value);
        } catch (error) {
            logger.error(`Error saving ${key} to remote webserver`, error);
            throw error;
        }
    }
}
