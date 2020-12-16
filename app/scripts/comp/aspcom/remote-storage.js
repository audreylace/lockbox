import { StorageBase } from 'storage/storage-base';
import { ServerActions } from './server-actions';
import { Logger } from 'util/logger';

const logger = new Logger('webserverremotestorage');

class RemoteStorage extends StorageBase {
    name = 'RemoteStorage';
    icon = 'server';
    enabled = true;
    uipos = 10;

    init() {
        super.init();
    }

    getPathForName(name) {
        return name;
    }

    stat(path, _, callback) {

        return ServerActions.getFileVersion(path)
        .then((rev) => callback(null, {rev }));
    }

    save(id, _, data, callback) {
        return ServerActions.saveKBDX(id, data)
            .then((results) => {
                if (callback) {
                    callback(results.error, results.name);
                }
            })
            .catch((error) =>
                logger.error(`Error saving kbdx with ${id} to remote webserver`, error)
            );
    }

    load(id, _, callback) {
        return ServerActions.loadKBDX(id)
            .then((results) => {
                if (callback) {
                    callback(results.error, results.vault, results.version);
                }
            })
            .catch((error) => {
                logger.error(`Error loading kbdx with ${id} from remote webserver`, error);
                callback(error);
            });
    }

    remove(id, _, callback) {
        return this.save(id, _, null, callback);
    }

    list(_, callback) {

        //path
        
        callback(null, []);
    }
}

export { RemoteStorage };
