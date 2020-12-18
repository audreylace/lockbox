import { ASPComServerModel } from './aspcom-server-model';
import { ASPComSettingsStore } from './aspcom-setting-store';

export { ASPComSettingsStore } from './aspcom-setting-store';
export { ASPComServerModel } from './aspcom-server-model';
export { ASPComStorage } from './aspcom-storage';

export function isAspComEnabled() {
    const appcomon = document.head.querySelector('meta[name=aspcom-enabled]') as HTMLMetaElement;
    if (appcomon && appcomon.content && appcomon.content === 'true') {
        return true;
    }

    return false;
}

export async function initAspCom(): Promise<void> {
    if (isAspComEnabled()) {
        let apiPath;

        const apiPathMeta = document.head.querySelector(
            'meta[name=aspcom-api-path]'
        ) as HTMLMetaElement;
        if (apiPathMeta && apiPathMeta.content) {
            apiPath = apiPathMeta.content;
        }

        await ASPComServerModel.connectToServer(apiPath);
        ASPComSettingsStore.hydrate(ASPComServerModel.userSettings);
    }
}
