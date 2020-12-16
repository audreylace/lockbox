import { ServerActions } from './server-actions';
import { Logger } from 'util/logger';

const logger = new Logger('webserversettingssync');

const SettingsStoreWebServer = {
    cache: {},
    hydrate() {
        return ServerActions.hydrate().then((data) => {
            this.cache = data;
        });
    },
    load(key) {
        if (this.cache[key]) {
            return Promise.resolve().then(() => this.cache[key]);
        }

        return ServerActions.loadSetting(key)
            .then((results) => {
                if (results.error) {
                    return Promise.reject(results.error);
                }
                return results.value;
            })
            .catch((error) => logger.error(`Error loading ${key} from remote webserver`, error));
    },
    save(key, value) {
        return ServerActions.saveSetting(key, value)
            .then((results) => {
                if (results.error) {
                    return Promise.reject(results.error);
                }

                this.cache[key] = value;
            })
            .catch((error) => logger.error(`Error saving ${key} to remote webserver`, error));
    }
};

export { SettingsStoreWebServer };
