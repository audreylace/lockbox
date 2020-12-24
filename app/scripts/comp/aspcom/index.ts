import { ASPComServerModel } from './aspcom-server-model';
import { ASPComSettingsStore } from './aspcom-setting-store';
import { AppView } from 'views/app-view';
import { AppModel } from 'models/app-model';
import { Locale } from 'util/locale';
import { Alerts } from 'comp/ui/alerts';

export { ASPComSettingsStore } from './aspcom-setting-store';
export { ASPComServerModel } from './aspcom-server-model';
export { ASPComStorage } from './aspcom-storage';

export enum ASPComEnabledState {
    On,
    Off,
    Testing,
    NeedsCheck
}
export let _aspComEnabledFlag: ASPComEnabledState = ASPComEnabledState.NeedsCheck;

export function isAspComEnabled() {
    if (_aspComEnabledFlag !== ASPComEnabledState.NeedsCheck) {
        return (
            _aspComEnabledFlag === ASPComEnabledState.On ||
            _aspComEnabledFlag === ASPComEnabledState.Testing
        );
    }

    const appcomon = document.head.querySelector('meta[name=aspcom-enabled]') as HTMLMetaElement;
    if (appcomon && appcomon.content && appcomon.content === 'true') {
        _aspComEnabledFlag = ASPComEnabledState.On;
        return true;
    }

    _aspComEnabledFlag = ASPComEnabledState.Off;

    return false;
}

export async function initAspCom(): Promise<void> {
    if (isAspComEnabled()) {
        let apiPath;

        if (_aspComEnabledFlag === ASPComEnabledState.Testing) {
            ASPComServerModel.initTestingState();
        } else {
            const apiPathMeta = document.head.querySelector(
                'meta[name=aspcom-api-path]'
            ) as HTMLMetaElement;
            if (apiPathMeta && apiPathMeta.content) {
                apiPath = apiPathMeta.content;
            }

            await ASPComServerModel.connectToServer(apiPath);
        }
        ASPComSettingsStore.hydrate(ASPComServerModel.getAppConfig().settings);
    }
}

export function beforeShowAppView(appView: AppView, _appModel: AppModel) {
    if (isAspComEnabled()) {
        (appView as any).disableOpenScreen = true;
    }
}

export function afterShowAppView(appView: AppView, appModel: AppModel) {
    if (isAspComEnabled()) {
        const launchData = ASPComServerModel.getVaultOpenData();

        appModel.openFile(launchData, (err: any) => {
            if (err) {
                Alerts.error({
                    header: Locale.openError,
                    body: Locale.openErrorDescription,
                    pre: this.errorToString(err)
                });
            } else {
                appView.showEntries();
            }
        });

        (appView as any).on('lock', () => {
            if (ASPComServerModel.inTestingMode) {
                document.body.innerHTML = '';
                const h1 = document.createElement('h1');
                h1.innerText = 'Workspace closed in lockbox testing mode';
                const h2 = document.createElement('h2');
                h2.innerText = 'Make a source change or ';
                const a = document.createElement('a');
                a.innerText = 'refresh';
                const h2textnode = document.createTextNode(' the view');

                h2.appendChild(a);
                h2.appendChild(h2textnode);

                document.body.appendChild(h1);
                document.body.appendChild(h2);

                a.addEventListener('click', () => window.location.reload());
            } else if (ASPComServerModel.__logoutURL) {
                window.location.assign(ASPComServerModel.__logoutURL);
            } else {
                window.location.assign('about:blank');
            }
        });
    }
}
