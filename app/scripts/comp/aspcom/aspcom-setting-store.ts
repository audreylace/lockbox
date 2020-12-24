import { ASPComServerModel } from './aspcom-server-model';
import { Logger } from 'util/logger';
import { SettingsStoreLocal } from 'comp/settings/settings-store-local';

const logger = new Logger('webserversettingssync');

export class ASPComSettingsStore {
    static supportedKeys: string[] = ['app-settings'];
    static cache: Map<string, any> = new Map();
    static hydrate(data: { [key: string]: any }) {
        const keys = Object.keys(data);
        keys.forEach((key) => {
            this.cache.set(key, data[key]);
        });
    }

    static async load<T = any>(key: string): Promise<T> {
        if (this.supportedKeys.indexOf(key) !== -1) {
            if (this.cache.has(key)) {
                return this.cache.get(key);
            } else {
                return undefined;
            }
        } else {
            return SettingsStoreLocal.load(key);
        }
        /* try {
            const results = await ASPComServerModel.loadSetting(key);
            this.cache.set(key, results.value);
            return results.value;
        } catch (error) {
            logger.error(`Error loading ${key} from remote webserver`, error);
            throw error;
        } */
    }

    static async save<TValue>(key: string, value: TValue): Promise<void> {
        if (this.supportedKeys.indexOf(key) !== -1) {
            try {
                await ASPComServerModel.saveSetting(key, value);
                this.cache.set(key, value);
            } catch (error) {
                logger.error(`Error saving ${key} to remote webserver`, error);
                throw error;
            }
        } else {
            return SettingsStoreLocal.save(key, value);
        }
    }
}
