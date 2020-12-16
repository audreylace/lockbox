import { StorageBase } from 'storage/storage-base';
import { ServerActions } from './server-actions';
import { Logger } from 'util/logger';

const logger = new Logger('webserverremotestorage');

class RemoteStorage extends StorageBase {
    name = 'remoteStorage';
    icon = 'server';
    enabled = true;
    uipos = 10;

    init() {
        super.init();
    }

    getPathForName(name) {
        return name;
    }

    stat(path, opts, callback) {
        return ServerActions.statKBDX(path)
            .then((rev) => callback(null, { rev }))
            .catch((err) => callback(err));
    }

    save(id, opts, data, callback, version) {
        return ServerActions.saveKBDX(id, data, version)
            .then((version) => callback(null, version))
            .catch((error) => {
                if (error.versionMismatch) {
                    error.revConflict = true;
                    callback(error);
                } else {
                    logger.error(`Error saving kbdx with ${id} to remote webserver`, error);
                    callback(error);
                }
            });
    }

    load(id, _, callback) {
        return ServerActions.loadKBDX(id)
            .then((results) => {
                callback(results.error, results.vault, results.version);
            })
            .catch((error) => {
                logger.error(`Error loading kbdx with ${id} from remote webserver`, error);
                callback(error);
            });
    }

    remove(id, _, callback) {
        return ServerActions.deleteKBDX(id)
            .then(() => callback())
            .catch((err) => callback(err));
    }

    list(_, callback) {
        return ServerActions.listKBDX()
            .then((list) => {
                callback(
                    null,
                    list.map((f) => {
                        return { name: f.name, path: f.name, rev: f.version };
                    })
                );
            })
            .catch((err) => callback(err));
    }
}

export { RemoteStorage };
