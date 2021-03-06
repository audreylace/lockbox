import { Events } from 'framework/events';
import { StartProfiler } from 'comp/app/start-profiler';
import { FileInfoCollection } from 'collections/file-info-collection';
import { AppRightsChecker } from 'comp/app/app-rights-checker';
import { ExportApi } from 'comp/app/export-api';
import { SingleInstanceChecker } from 'comp/app/single-instance-checker';
import { Updater } from 'comp/app/updater';
import { UsbListener } from 'comp/app/usb-listener';
import { FeatureTester } from 'comp/browser/feature-tester';
import { FocusDetector } from 'comp/browser/focus-detector';
import { IdleTracker } from 'comp/browser/idle-tracker';
import { KeyHandler } from 'comp/browser/key-handler';
import { PopupNotifier } from 'comp/browser/popup-notifier';
import { Launcher } from 'comp/launcher';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Alerts } from 'comp/ui/alerts';
import { Timeouts } from 'const/timeouts';
import { AppModel } from 'models/app-model';
import { AppSettingsModel } from 'models/app-settings-model';
import { RuntimeDataModel } from 'models/runtime-data-model';
import { UpdateModel } from 'models/update-model';
import { PluginManager } from 'plugins/plugin-manager';
import { Features } from 'util/features';
import { KdbxwebInit } from 'util/kdbxweb/kdbxweb-init';
import { Locale } from 'util/locale';
import { AppView } from 'views/app-view';
import 'hbs-helpers';
import { AutoType } from './auto-type';
import { Storage } from './storage';
import {
    ASPComServerModel,
    initAspCom,
    isAspComEnabled,
    beforeShowAppView,
    afterShowAppView
} from 'comp/aspcom';

const stopStyle = 'color: tomato;  font-size:60px;';
// eslint-disable-next-line no-console
console.log('%cStop!', stopStyle);

const stopMessageStyle = 'color: black;  font-size:18px;';
// eslint-disable-next-line no-console
console.log(
    '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your account.',
    stopMessageStyle
);

StartProfiler.milestone('loading modules');

const ready = (Launcher && Launcher.ready) || $;

ready(() => {
    StartProfiler.milestone('document ready');

    const appModel = new AppModel();
    StartProfiler.milestone('creating app model');

    Promise.resolve()
        .then(loadConfigs)
        .then(initModules)
        .then(loadRemoteConfig)
        .then(ensureCanRun)
        .then(initStorage)
        .then(showApp)
        .then(postInit)
        .catch((e) => {
            appModel.appLogger.error('Error starting app', e);
        });

    function ensureCanRun() {
        if (Features.isFrame && !appModel.settings.allowIframes) {
            return Promise.reject(
                'Running in iframe is not allowed (this can be changed in the app config).'
            );
        }
        return FeatureTester.test()
            .catch((e) => {
                Alerts.error({
                    header: Locale.appSettingsError,
                    body: Locale.appNotSupportedError,
                    pre: e,
                    buttons: [],
                    esc: false,
                    enter: false,
                    click: false
                });
                throw 'Feature testing failed: ' + e;
            })
            .then(() => {
                StartProfiler.milestone('checking features');
            });
    }

    function loadConfigs() {
        return initAspCom()
            .then(() => {
                Promise.all([
                    AppSettingsModel.load(),
                    UpdateModel.load(),
                    RuntimeDataModel.load(),
                    FileInfoCollection.load()
                ]).then(() => {
                    StartProfiler.milestone('loading configs');
                });
            })
            .catch(() => {
                Alerts.error({
                    header: 'App failed to start',
                    body: '',
                    buttons: [],
                    esc: false,
                    enter: false,
                    click: false
                });
                return Promise.reject();
            });
    }

    function initModules() {
        KeyHandler.init();
        PopupNotifier.init();
        KdbxwebInit.init();
        FocusDetector.init();
        AutoType.init();
        window.kw = ExportApi;
        return PluginManager.init().then(() => {
            StartProfiler.milestone('initializing modules');
        });
    }

    function showSettingsLoadError() {
        Alerts.error({
            header: Locale.appSettingsError,
            body: Locale.appSettingsErrorBody,
            buttons: [],
            esc: false,
            enter: false,
            click: false
        });
    }

    function loadRemoteConfig() {
        return Promise.resolve()
            .then(() => {
                SettingsManager.setBySettings(appModel.settings);
                if (isAspComEnabled() && ASPComServerModel.getAppConfig()) {
                    appModel.applyUserConfig(ASPComServerModel.getAppConfig());
                    SettingsManager.setBySettings(appModel.settings);
                } else {
                    const configParam = getConfigParam();
                    if (configParam) {
                        return appModel
                            .loadConfig(configParam)
                            .then(() => {
                                SettingsManager.setBySettings(appModel.settings);
                            })
                            .catch((e) => {
                                if (!appModel.settings.cacheConfigSettings) {
                                    showSettingsLoadError();
                                    throw e;
                                }
                            });
                    }
                }
            })
            .then(() => {
                StartProfiler.milestone('loading remote config');
            });
    }

    function initStorage() {
        for (const prv of Object.values(Storage)) {
            prv.init();
        }
        StartProfiler.milestone('initializing storage');
    }

    function showApp() {
        return Promise.resolve().then(() => {
            const skipHttpsWarning =
                localStorage.skipHttpsWarning || appModel.settings.skipHttpsWarning;
            const protocolIsInsecure = ['https:', 'file:', 'app:'].indexOf(location.protocol) < 0;
            const hostIsInsecure = location.hostname !== 'localhost';
            if (protocolIsInsecure && hostIsInsecure && !skipHttpsWarning) {
                return new Promise((resolve) => {
                    Alerts.error({
                        header: Locale.appSecWarn,
                        icon: 'user-secret',
                        esc: false,
                        enter: false,
                        click: false,
                        body: Locale.appSecWarnBody1 + '\n\n' + Locale.appSecWarnBody2,
                        buttons: [{ result: '', title: Locale.appSecWarnBtn, error: true }],
                        complete: () => {
                            showView();
                            resolve();
                        }
                    });
                });
            } else {
                showView();
                return new Promise((resolve) => requestAnimationFrame(resolve));
            }
        });
    }

    function postInit() {
        Updater.init();
        SingleInstanceChecker.init();
        AppRightsChecker.init();
        IdleTracker.init();
        UsbListener.init();
        setTimeout(() => {
            PluginManager.runAutoUpdate();
        }, Timeouts.AutoUpdatePluginsAfterStart);
    }

    function showView() {
        const appView = new AppView(appModel);

        beforeShowAppView(appView, appModel);

        appView.render();

        afterShowAppView(appView, appModel);

        StartProfiler.milestone('first view rendering');

        Events.emit('app-ready');
        StartProfiler.milestone('app ready event');

        StartProfiler.report();
    }

    function getConfigParam() {
        const metaConfig = document.head.querySelector('meta[name=kw-config]');
        if (metaConfig && metaConfig.content && metaConfig.content[0] !== '(') {
            return metaConfig.content;
        }
        const match = location.search.match(/[?&]config=([^&]+)/i);
        if (match && match[1]) {
            return match[1];
        }
    }
});
