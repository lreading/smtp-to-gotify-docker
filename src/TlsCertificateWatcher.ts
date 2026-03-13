import fs, { FSWatcher } from 'fs';
import path from 'path';
import { Logger } from 'winston';
import { SMTPServer } from 'smtp-server';

import { config } from './Config';
import { getLogger } from './Logger';

export class TlsCertificateWatcher {
    private readonly logger: Logger;
    private readonly server: SMTPServer;
    private readonly watchedFiles: Set<string>;
    private readonly watchedDirectories: Set<string>;
    private readonly watchers: FSWatcher[];
    private reloadTimeout: NodeJS.Timeout | null;
    private tlsContextLoaded: boolean;

    constructor(server: SMTPServer) {
        this.logger = getLogger(this.constructor.name);
        this.server = server;
        this.watchedFiles = new Set<string>();
        if (config.tlsKeyPath) {
            this.watchedFiles.add(path.basename(config.tlsKeyPath));
        }
        if (config.tlsCertPath) {
            this.watchedFiles.add(path.basename(config.tlsCertPath));
        }
        this.watchedDirectories = new Set<string>();
        this.watchers = [];
        this.reloadTimeout = null;
        this.tlsContextLoaded = false;
    }

    start(): void {
        if (!config.tlsKeyPath || !config.tlsCertPath) {
            return;
        }

        this.reloadTlsContext('initial load');
        this.watchParentDirectory(config.tlsKeyPath);
        this.watchParentDirectory(config.tlsCertPath);
    }

    private reloadTlsContext(reason: string): void {
        if (!this.tlsFilesExist()) {
            if (!this.tlsContextLoaded) {
                this.disableStartTls();
                this.logger.warn(`TLS certificate files are not available during ${reason}; STARTTLS will stay disabled`);
            } else {
                this.logger.warn(`TLS certificate files are not available during ${reason}; keeping the current TLS context`);
            }
            return;
        }

        try {
            const key = fs.readFileSync(config.tlsKeyPath);
            const cert = fs.readFileSync(config.tlsCertPath);

            this.enableStartTls();
            this.server.updateSecureContext({ key, cert });

            this.tlsContextLoaded = true;
            this.logger.info(`TLS certificate context reloaded during ${reason}`);
        } catch (err) {
            if (!this.tlsContextLoaded) {
                this.disableStartTls();
            }
            this.logger.error(`Failed to reload TLS certificate context during ${reason}`, err);
        }
    }

    private scheduleReload(): void {
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }

        this.reloadTimeout = setTimeout(() => {
            this.reloadTimeout = null;
            this.reloadTlsContext('filesystem change');
        }, 250);
    }

    private tlsFilesExist(): boolean {
        return fs.existsSync(config.tlsKeyPath) && fs.existsSync(config.tlsCertPath);
    }

    private disableStartTls(): void {
        const disabledCommands = this.server.options.disabledCommands || [];
        if (!disabledCommands.includes('STARTTLS')) {
            disabledCommands.push('STARTTLS');
        }
        this.server.options.disabledCommands = disabledCommands;
    }

    private enableStartTls(): void {
        const disabledCommands = this.server.options.disabledCommands || [];
        this.server.options.disabledCommands = disabledCommands.filter((command) => command !== 'STARTTLS');
    }

    private watchParentDirectory(filePath: string): void {
        const directory = path.dirname(filePath);
        if (this.watchedDirectories.has(directory)) {
            return;
        }

        this.watchedDirectories.add(directory);

        const watcher = fs.watch(directory, (eventType, filename) => {
            const changedFile = filename?.toString();
            if (changedFile && !this.watchedFiles.has(changedFile)) {
                return;
            }

            this.logger.info(`Detected TLS file ${eventType} event in ${directory}`);
            this.scheduleReload();
        });

        watcher.on('error', (err) => {
            this.logger.error(`TLS file watcher error for ${directory}`, err);
        });

        this.watchers.push(watcher);
    }
}
