import { ASPComServerModel } from './aspcom-server-model';
import { Logger } from 'util/logger';
import { SettingsStoreLocal } from 'comp/settings/settings-store-local';
import { ASPComEnabledState } from './index';

const logger = new Logger('ASPComSettingsStore');

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
                logger.debug(`returned key ${key}`);
                return this.cache.get(key);
            } else {
                return undefined;
            }
        } else {
            logger.debug(`key ${key} not supported, loading from browser instead`);
            return SettingsStoreLocal.load(key);
        }
    }

    static async save<TValue>(key: string, value: TValue): Promise<void> {
        if (this.supportedKeys.indexOf(key) !== -1) {
            if (ASPComServerModel.inTestingMode) {
                logger.info('Skipping save to remote server since in testing mode');
                return;
            }

            try {
                logger.debug('Attempting to sync settings to remote server');
                await ASPComServerModel.saveSetting(key, value);
                this.cache.set(key, value);
            } catch (error) {
                logger.error(`Error saving ${key} to remote webserver`, error);
                throw error;
            }
        } else {
            logger.debug('Key not supported, saving to browser instead');
            return SettingsStoreLocal.save(key, value);
        }
    }
}
