import { SettingsStoreLocal } from './settings-store-local';
import { ASPComSettingsStore } from 'comp/aspcom';
import { Features } from 'util/features';

let exportValue = SettingsStoreLocal;

if (Features.isAspComEnabled()) {
    exportValue = ASPComSettingsStore;
}

export { exportValue as SettingsStore };
