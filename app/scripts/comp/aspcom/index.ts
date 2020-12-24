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

export function isAspComEnabled(): boolean {
    if (_aspComEnabledFlag !== ASPComEnabledState.NeedsCheck) {
        return (
            _aspComEnabledFlag === ASPComEnabledState.On ||
            _aspComEnabledFlag === ASPComEnabledState.Testing
        );
    }

    _aspComEnabledFlag = ASPComEnabledState.Off;

    const pageParams = new URLSearchParams(window.location.search);
    if (pageParams.get('development') === 'true') {
        _aspComEnabledFlag = ASPComEnabledState.Testing;
    } else {
        const appcomon = document.head.querySelector(
            'meta[name=aspcom-enabled]'
        ) as HTMLMetaElement;
        if (appcomon && appcomon.content) {
            switch (appcomon.content) {
                case 'true':
                    _aspComEnabledFlag = ASPComEnabledState.On;
                    break;
                case 'testing':
                    _aspComEnabledFlag = ASPComEnabledState.Testing;
                    break;
            }
        }
    }

    return isAspComEnabled();
}

export async function initAspCom(): Promise<void> {
    if (isAspComEnabled()) {
        let apiPath;

        if (_aspComEnabledFlag === ASPComEnabledState.Testing) {
            return new Promise((resolve, reject) => {
                let serverpath: string | undefined;
                const pageParams = new URLSearchParams(window.location.search);
                if (pageParams.get('server') && pageParams.get('server') !== '') {
                    serverpath = pageParams.get('server');
                }

                let body =
                    'You are about to run Lockbox in development mode. If you did not intend to do this then do not continue as this may be a phishing attempt.';
                if (serverpath) {
                    body = `You are about to run Lockbox in development mode. If you did not intend to do this then do not continue as this may be a phishing attempt. Note, lockbox will attempt to connect to ${serverpath}, make sure this is the URL you intended.`;
                }
                Alerts.yesno({
                    header: 'Continue in development mode',
                    body,

                    success: () => {
                        ASPComServerModel.initTestingState();

                        if (serverpath) {
                            _aspComEnabledFlag = ASPComEnabledState.On;
                            ASPComServerModel.connectToServer(serverpath)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            resolve();
                        }
                    },
                    cancel: () => {
                        document.body.innerHTML = '';
                        document.body.style.background = 'red';
                        const h1 = document.createElement('h1');
                        h1.innerText =
                            'Lockbox has been closed. Please close this tab immediately for your safety!';
                        document.body.appendChild(h1);
                    }
                });
            });
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
                document.body.style.padding = '5px';
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
