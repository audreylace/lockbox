import { FileModel } from 'models/file-model';

// eslint-disable-next-line import/no-commonjs
const kbdxweb = require('kdbxweb'); // { ProtectedValue } from 'kdbxweb';

export interface IServerError {
    code: number;
    message: string;
}

export interface IServerBaseResponse {
    error?: IServerError;
}

interface IKeyValObject<T = any> {
    [key: string]: T;
}

interface IServerKBDXSaveRequest {
    version?: string;
    vault: any;
    name: string;
}

interface IServerKBDXSaveResponse extends IServerBaseResponse {
    version: string;
    name: string;
}

interface IVaultInfo {
    id: string; // 'a75493bb-3e97-e94a-3599-e77964e6605f',
    // 'storage': null,
    // 'path': '',
    // 'modified': false,
    // 'editState': {},
    // 'rev': null,
    // 'syncDate': '2020-12-21T19:27:13.827Z',
    // 'openDate': '2020-12-21T20:07:14.138Z',
    // keyFileName': 'New.key',
    password: string; // 'iPOp6NYx8vcUoX23+2KSCq04nDLL0eh43VDDjeMBm+8=',
    vault: string;
    revision: string;
    // 'keyFilePath': null,
    // 'opts': null,
    // 'backup': null,
    // 'fingerprint': null,
    // 'chalResp': null,
    // 'password': kbdxweb.ProtectedValue.fromString('1234')
}

export interface IOpenInfo {
    id: string;
    name: string;
    storage: string;
    path: string;
    password: any;
    fileData: any;
    rev: string;
}

interface IServerConnectResponseAuthenticated extends IServerBaseResponse {
    isAuthenticated: true;
    paths: IKeyValObject;
    userSettings: IKeyValObject;
    vault: IVaultInfo;
    logoutURL: string;
}

interface IServerConnectResponseNotAuthenticated extends IServerBaseResponse {
    isAuthenticated: false;
    loginURL: string;
}

type IServerConnectResponse =
    | IServerConnectResponseAuthenticated
    | IServerConnectResponseNotAuthenticated;

interface IServerKBDXStatRequest {
    name: string;
}

interface IServerKBDXStatResponse extends IServerBaseResponse {
    name: string;
    version: string;
}

interface IServerKBDXLoadRequest {
    name: string;
}

interface IServerKBDXLoadResponse extends IServerError {
    name: string;
    vault: any;
    version: string;
}

interface IServerKBDXRemoveRequest {
    name: string;
    version?: string;
}

interface IServerKBDXRemoveResponse {
    name: string;
}

interface IServerKBDXInfo {
    name: string;
    version: string;
}

export class ASPComServerModel {
    /** Active request. Used to sequence commands sent to the web server. */
    static __activeRequest: Promise<any> = Promise.resolve();
    static __userSettings: IKeyValObject | null = null;
    static __logoutURL?: string;
    static __vault?: IVaultInfo;
    static inTestingMode: boolean = false;

    static fetchTemplates: IKeyValObject = {
        connect: {
            path: '/api/connect',
            template: {
                method: 'GET',
                cache: 'no-cache',
                redirect: 'follow'
            }
        }
    };

    static issueRequest<RequestType, ResponseType>(
        name: string,
        data: RequestType,
        overrides: IKeyValObject = {}
    ): Promise<ResponseType> {
        const fetchTemplate = this.fetchTemplates[name];
        if (!fetchTemplate) {
            return Promise.reject(new Error('Request method was not defined by webserver'));
        }

        this.__activeRequest = this.__activeRequest
            .then(() => {
                const fetchOptions = { ...fetchTemplate.options };

                if (overrides.template) {
                    Object.assign(fetchOptions, overrides.template);
                }

                if (fetchTemplate.hasBody || overrides.hasBody) {
                    fetchOptions.body = JSON.stringify(data);
                }

                const path = overrides.path;
                return fetch(path || fetchTemplate.path, fetchOptions);
            })
            .then((response) => {
                if (!response.ok) {
                    return Promise.reject(`Request failed for ${fetchTemplate.path}`);
                }

                return response.json().then((jsonResponse) => {
                    if (!jsonResponse) {
                        return Promise.reject(
                            new Error('Invalid response returned from web server')
                        );
                    }
                    if (jsonResponse.error) {
                        return Promise.reject(jsonResponse.error);
                    }
                });
            });

        this.__activeRequest.catch(() => {
            this.__activeRequest = Promise.resolve();
        });

        return this.__activeRequest;
    }

    static initTestingState(): void {
        // this.__logoutURL = 'about:blank';
        this.inTestingMode = true;
        this.__userSettings = {
            'theme': 'light',
            'rememberKeyFiles': 'data',
            'colorfulIcons': true,
            'helpTipCopyShown': true,
            'demoOpened': false
        };

        const cachedFileData =
            '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';

        this.__vault = {
            id: 'd3018f68-e23f-5a17-d402-e5137f9f75d2',
            password: '1234',
            vault: cachedFileData,
            revision: '5'
        };
    }

    static updateVaultDataInTestingMode(data: any) {
        if (!this.inTestingMode) {
            throw Error('Can not update model live if not in testing mode');
        }
        this.__vault.vault = btoa(String.fromCharCode(...new Uint8Array(data)));
        this.__vault.revision = (+this.__vault.revision + 1).toString();
    }

    static getVaultOpenData(): IOpenInfo {
        return {
            'id': this.__vault.id,
            'rev': this.__vault.revision,
            'name': 'Secure Vault',
            'storage': 'remoteStorage',
            'path': this.__vault.id,
            'password': kbdxweb.ProtectedValue.fromString(this.__vault.password),
            'fileData': Uint8Array.from(atob(this.__vault.vault), (c) => c.charCodeAt(0)).buffer
        };
    }

    static getAppConfig(): IKeyValObject<any> {
        return {
            settings: this.__userSettings
        };
    }

    static async connectToServer(path: string): Promise<void> {
        const response = await this.issueRequest<undefined, IServerConnectResponse>(
            'connect',
            undefined,
            {
                path
            }
        );

        if (response.isAuthenticated) {
            this.__userSettings = response.userSettings;
            this.fetchTemplates = response.paths;
            this.__logoutURL = response.logoutURL;
        } else {
            // If not authenticated redirect to authentication URL.
            window.location.assign((response as IServerConnectResponseNotAuthenticated).loginURL);
        }
    }

    /**
     * syncs a KBDX vault to the web server. If this is a new vault, then the associated record will be
     * created on the web server. To delete a vault, just pass in null for the vault object. The
     * web server will then delete the record.
     * @param {string} key The name of the KBDX vault to save.
     * @param {object} vault The KBDX object to save. Pass in null here to delete an existing vault.
     */
    static async saveKBDX(name: string, vault: any, version: string): Promise<string> {
        const response = await this.issueRequest<IServerKBDXSaveRequest, IServerKBDXSaveResponse>(
            'savekbdx',
            {
                name,
                vault,
                version
            }
        );
        return response.version;
    }

    /**
     * Loads a KBDX vault from the web server given the key.
     * @param {string} name of the KBDX vault to load
     */
    static async loadKBDX(name: string): Promise<any> {
        const response = await this.issueRequest<IServerKBDXLoadRequest, IServerKBDXLoadResponse>(
            'loadKBDX',
            { name }
        );
        return response.vault;
    }

    static async statKBDX(name: string): Promise<string> {
        const response = await this.issueRequest<IServerKBDXStatRequest, IServerKBDXStatResponse>(
            'statkbdx',
            { name }
        );
        return response.version;
    }

    static async removeKBDX(name: string): Promise<void> {
        await this.issueRequest<IServerKBDXRemoveRequest, IServerKBDXRemoveResponse>('removekbdx', {
            name
        });
    }

    static async listKBDX() {
        const response = await this.issueRequest<{}, { list: IServerKBDXInfo[] }>('listkbdx', {});
        return response.list;
    }

    /**
     *
     * @param {string} key The name of the setting to save
     * @param {any} value The value to save
     */
    static async saveSetting<ValueType>(key: string, value: ValueType): Promise<void> {
        await this.issueRequest<{ key: String; value: any }, {}>('savesetting', { key, value });
    }

    /**
     * Loads a setting key from the web server
     * @param {string} key The key to load
     */
    static async loadSetting(key: string) {
        const response = await this.issueRequest<{ key: string }, { key: string; value: any }>(
            'loadsettings',
            { key }
        );
        return response.value;
    }
}
