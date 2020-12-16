import { Sequencer } from './sequencer';

const ServerActions = {
    activeRequest: Promise.resolve(),
    fetchTemplates: {},

    request(name, data) {
        const fetchTemplate = this.fetchTemplates[name];
        if (!fetchTemplate) {
            return Promise.reject(new Error('Request method was not defined by webserver'));
        }

        this.activeRequest = this.activeRequest
            .then(() => {
                const fetchOptions = { ...fetchTemplate.options };
                fetchOptions.body = JSON.stringify(data);

                return fetch(fetchTemplate.path);
            })
            .then((response) => {
                if (!response.ok) {
                    return Promise.reject(`Request failed for ${fetchTemplate.path}`);
                }

                return response.json();
            });

        this.activeRequest.catch(() => {
            this.activeRequest = Promise.resolve();
        });

        return this.activeRequest;
    },

    /** Name of handlers on the webserver */
    requests: {
        hydrateApplication: 'hydrate',
        saveKBDX: 'savekbdx',
        loadKBDX: 'loadkbdx',
        saveSettings: 'savesetting',
        loadSetting: 'loadsetting',
        getFileVersion: ''
    },
    isSane(response) {
        if (!response) {
            return Promise.reject(new Error('Invalid response returned from web server'));
        }

        if (response.error) {
            return Promise.reject(response.error);
        }

        return response;
    },
    /**
     * Hydrates the application loading all settings for the app.
     */
    hydrate() {
        return Sequencer.request(this.requests.hydrateApplication, {})
            .then((response) => this.isSane(response))
            .then((response) => response.data);
    },
    /**
     * syncs a KBDX vault to the web server. If this is a new vault, then the associated record will be
     * created on the web server. To delete a vault, just pass in null for the vault object. The
     * web server will then delete the record.
     * @param {string} key The name of the KBDX vault to save.
     * @param {object} vault The KBDX object to save. Pass in null here to delete an existing vault.
     * @returns A single object with the following properties:
     *  {
     *      name {string} Name of the vault
     *      error {error | undefined} If the save fails, this will have the
     *                                failure reason. Otherwise this will be undefined.
     *  }
     */
    saveKBDX(key, vault) {
        return Sequencer.request(this.requests.saveKBDX, { key, vault }).then((response) =>
            this.isSane(response)
        );
    },
    /**
     * Loads a KBDX vault from the web server given the key.
     * @param {string} name of the KBDX vault to load
     * @returns
     * {
     *  key {string} Name of the vault
     *  vault {object | null} The vault if it exists, otherwise null.
     *  error {error | undefined} If an error occurs then this will be populated.
     * }
     */
    loadKBDX(key) {
        return Sequencer.request(this.requests.loadKBDX, { key }).then((response) =>
            this.isSane(response)
        );
    },
    /**
     *
     * @param {string} key The name of the setting to save
     * @param {any} data The value to save
     * @returns
     * {
     *   name {string} Name of the setting updated
     *   error {error | undefined}
     * }
     */
    saveSetting(key, data) {
        return Sequencer.request(this.requests.saveSettings, { key, data }).then((response) =>
            this.isSane(response)
        );
    },
    /**
     * Loads a setting key from the web server
     * @param {string} key The key to load
     * @returns
     * {
     *  name {string} Name of setting loaded
     *  value {any} The value at this setting
     *  error {error | undefined}
     * }
     */
    loadSetting(key) {
        return Sequencer.request(this.requests.loadSetting, { key }).then((response) =>
            this.isSane(response)
        );
    },

    getFileVersion(key) {
        return Sequencer.request(this.requests.getFileVersion, { key })
            .then((response) => this.isSane(response))
            .then((response) => response.version);
    }
};

export { ServerActions };
