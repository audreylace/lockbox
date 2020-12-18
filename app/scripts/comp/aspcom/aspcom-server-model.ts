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

interface IServerConnectResponse extends IServerBaseResponse {
    clientConfig: IKeyValObject;
    userSettings: IKeyValObject;
    paths: IKeyValObject;
}

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
    static clientConfig: IKeyValObject | null = null;
    static userSettings: IKeyValObject | null = null;

    static fetchTemplates: IKeyValObject = {
        getconfig: {
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

    static async connectToServer(path: string): Promise<void> {
        const response = await this.issueRequest<undefined, IServerConnectResponse>(
            'connect',
            undefined,
            {
                path
            }
        );
        this.clientConfig = response.clientConfig;
        this.userSettings = response.userSettings;
        this.fetchTemplates = response.paths;
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
