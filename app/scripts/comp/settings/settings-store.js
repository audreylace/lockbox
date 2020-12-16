import { SettingsStoreLocal } from './settings-store-local';
import { SettingsStoreWebServer } from 'comp/aspcom/settings-store-webserver';
import { Features } from 'util/features';

let exportValue = SettingsStoreLocal;

if (Features.isAspComEnabled()) {
    exportValue = SettingsStoreWebServer;
}

export { exportValue as SettingsStore };
