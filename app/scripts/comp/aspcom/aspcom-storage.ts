import { StorageBase } from 'storage/storage-base';
import { ASPComServerModel } from './aspcom-server-model';
import { Logger } from 'util/logger';

const logger = new Logger('webserverremotestorage');

type ListType = { name: string; path: string; rev: string };
type StatCallback = (error?: any, data?: { rev: string }) => void;
type SaveCallback = (error?: any, stat?: { rev: string }) => void;
type LoadCallback = (error?: any, vault?: any, version?: string) => void;
type ListCallback = (error?: any, values?: ListType[]) => void;
type RemoveCallback = (error?: any) => void;

export class ASPComStorage extends StorageBase {
    name = 'remoteStorage';
    icon = 'server';
    enabled = true;
    uipos = 10;

    public getPathForName(name: string) {
        return name;
    }

    public async stat(path: string, _opts: any, callback: StatCallback) {
        try {
            const rev = await ASPComServerModel.statKBDX(path);
            callback(null, { rev });
        } catch (err) {
            callback(err);
        }
    }

    public async save(
        id: string,
        _opts: any,
        data: any,
        callback: SaveCallback,
        currentVersion: string
    ) {
        try {
            const newVersion = await ASPComServerModel.saveKBDX(id, data, currentVersion);
            callback(null, { rev: newVersion });
        } catch (error) {
            if (error.code === 2000) {
                error.revConflict = true;
            } else {
                logger.error(`Error saving kbdx with ${id} to remote webserver`, error);
            }
            callback(error);
        }
    }

    public async load(id: string, _: any, callback: LoadCallback) {
        try {
            const results = await ASPComServerModel.loadKBDX(id);
            callback(results.error, results.vault, results.version);
        } catch (error) {
            logger.error(`Error loading kbdx with ${id} from remote webserver`, error);
            callback(error);
        }
    }

    public async remove(id: string, _: any, callback: RemoveCallback) {
        let error = null;

        try {
            await ASPComServerModel.removeKBDX(id);
        } catch (err) {
            error = err;
        }
        callback(error);
    }

    public async list(_: any, callback: ListCallback) {
        let error = null;
        let data: ListType[] = [];
        try {
            const list = await ASPComServerModel.listKBDX();
            data = list.map((f) => {
                return { name: f.name, path: f.name, rev: f.version };
            });
        } catch (err) {
            error = err;
        }

        callback(error, data);
    }
}
