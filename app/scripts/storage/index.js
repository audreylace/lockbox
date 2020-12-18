import { Launcher } from 'comp/launcher';
import { ASPComStorage } from 'comp/aspcom';
import { StorageFile } from 'storage/impl/storage-file';
import { StorageFileCache } from 'storage/impl/storage-file-cache';
import { createOAuthSession } from 'storage/pkce';
import { StorageGDrive } from 'storage/impl/storage-gdrive';
import { StorageOneDrive } from 'storage/impl/storage-onedrive';
import { StorageWebDav } from 'storage/impl/storage-webdav';
import { StorageDropbox } from 'storage/impl/storage-dropbox';
import { StorageCache } from 'storage/impl/storage-cache';
import { Features } from 'util/features';

const BuiltInStorage = {
    file: new StorageFile(),
    cache: Launcher ? new StorageFileCache() : new StorageCache()
};

const ThirdPartyStorage = {
    dropbox: new StorageDropbox(),
    gdrive: new StorageGDrive(),
    onedrive: new StorageOneDrive(),
    webdav: new StorageWebDav()
};

const Storage = BuiltInStorage;
if (!Launcher || Launcher.thirdPartyStoragesSupported) {
    Object.assign(Storage, ThirdPartyStorage);
}

if (Features.isAspComEnabled()) {
    Storage.remoteStorage = new ASPComStorage();
}

requestAnimationFrame(createOAuthSession);

export { Storage };
