import { SettingsStoreLocal } from './settings-store-local';
import { ASPComSettingsStore, isAspComEnabled } from 'comp/aspcom';

let exportValue = SettingsStoreLocal;

if (isAspComEnabled()) {
    exportValue = ASPComSettingsStore;
}

export { exportValue as SettingsStore };
