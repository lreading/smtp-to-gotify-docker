import { Logger } from 'winston';
import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

import { config } from './Config';
import { Gotify } from './Gotify';
import { getLogger } from './Logger';
import { TlsCertificateWatcher } from './TlsCertificateWatcher';

export class Smtp {
    private readonly gotify: Gotify;
    private readonly server: SMTPServer;
    private readonly logger: Logger;
    private readonly tlsCertificateWatcher: TlsCertificateWatcher;

    constructor() {
        this.logger = getLogger(this.constructor.name);
        this.gotify = new Gotify();
        this.server = this.createServer();
        this.tlsCertificateWatcher = new TlsCertificateWatcher(this.server);
        this.server.on('error', (err) => {
            this.logger.error('SMTP server error', err);
        });
    }

    start(): void {
        this.tlsCertificateWatcher.start();
        this.logger.info(`Starting SMTP server at ${config.bindIp}:${config.port}`);
        this.server.listen(config.port, config.bindIp);
    }

    private createServer(): SMTPServer {
        const $this = this;

        const options: any = {
            authOptional: false,
            onData(stream, session, callback) {
                simpleParser(stream, {}, (err, parsed) => {
                    if (err) {
                        $this.logger.error(`Error parsing email from ${session.user}`);
                        $this.logger.error(err);
                        return;
                    }
                    $this.logger.info(`Successfully parsed email from ${session.user}`);
                    $this.gotify.postMessage(parsed.subject, parsed.text).then(() => {
                        callback();
                    });
                });
            },
            onAuth(auth, session, callback) {
                if (auth.accessToken === config.apiKey || auth.password === config.apiKey) {
                    return callback(null, { user: auth.username });
                }
        
                $this.logger.warn(`Invalid login attempt for ${auth.username} from ${session.remoteAddress}`);
                if (auth.accessToken) {
                    return callback(null, { data: { error: 'Invalid login' }});
                }
                return callback(new Error('Invalid login'), null);
            },
            authMethods: ['XOAUTH2', 'LOGIN']
        };

        if (config.tlsKeyPath && config.tlsCertPath) {
            this.logger.info('STARTTLS is configured; certificate watcher will manage TLS context reloads');
            options.disabledCommands = ['STARTTLS'];
        }

        return new SMTPServer(options);
    }
}
