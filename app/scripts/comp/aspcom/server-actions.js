const ServerActions = {
    activeRequest: Promise.resolve(),

    fetchTemplates: {
        getconfig: {
            path: '/api/config',
            template: {
                method: 'GET',
                cache: 'no-cache',
                redirect: 'follow'
            }
        }
    },

    issueRequest(name, data, overrides) {
        const fetchTemplate = this.fetchTemplates[name];
        if (!fetchTemplate) {
            return Promise.reject(new Error('Request method was not defined by webserver'));
        }

        this.activeRequest = this.activeRequest
            .then(() => {
                const fetchOptions = { ...fetchTemplate.options };

                if (!overrides) {
                    overrides = {};
                }

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

        this.activeRequest.catch(() => {
            this.activeRequest = Promise.resolve();
        });

        return this.activeRequest;
    },

    loadConfig(path) {
        return this.issueRequest('getconfig', undefined, { path }).then(
            (response) => response.data
        );
    },

    /**
     * Hydrates the application loading all settings for the app.
     */
    hydrateSettings() {
        return this.issueRequest('hydrate').then((response) => response.data);
    },
    /**
     * syncs a KBDX vault to the web server. If this is a new vault, then the associated record will be
     * created on the web server. To delete a vault, just pass in null for the vault object. The
     * web server will then delete the record.
     * @param {string} key The name of the KBDX vault to save.
     * @param {object} vault The KBDX object to save. Pass in null here to delete an existing vault.
     */
    saveKBDX(key, vault, version) {
        return this.issueRequest('savekbdx', { key, vault, version }).then(
            (response) => response.version
        );
    },
    /**
     * Loads a KBDX vault from the web server given the key.
     * @param {string} name of the KBDX vault to load
     */
    loadKBDX(key) {
        return this.issueRequest('loadKBDX', { key }).then((response) => response.vault);
    },
    statKBDX(key) {
        return this.issueRequest('statkbdx', { key }).then((response) => response.version);
    },
    removeKBDX(key) {
        return this.issueRequest('removekbdx', { key }).then((response) => undefined);
    },
    listKBDX() {
        return this.issueRequest('listkbdx').then((response) => response.list);
    },
    /**
     *
     * @param {string} key The name of the setting to save
     * @param {any} value The value to save
     */
    saveSetting(key, value) {
        return this.issueRequest('savesetting', { key, value }).then((response) => undefined);
    },
    /**
     * Loads a setting key from the web server
     * @param {string} key The key to load
     */
    loadSetting(key) {
        return this.issueRequest('loadsettings', { key }).then((response) => response.value);
    },

    getFileVersion(key) {
        return this.issueRequest('getfileversion', { key }).then((response) => response.version);
    }
};

export { ServerActions };
