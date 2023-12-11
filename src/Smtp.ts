import { getLogger, TSLogger } from '@thenerdyhick/ts-logger';
import { simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';

import { config } from './Config';
import { Gotify } from './Gotify';

export class Smtp {
    private readonly gotify: Gotify;
    private readonly server: SMTPServer;
    private readonly logger: TSLogger;

    constructor() {
        this.logger = getLogger(this.constructor.name);
        this.gotify = new Gotify();
        this.server = this.createServer();
    }

    start(): void {
        this.logger.info(`Starting server at ${config.bindIp}:${config.port}`);
        this.server.listen(config.port, config.bindIp);
    }

    private createServer(): SMTPServer {
        const $this = this;

        return new SMTPServer({
            authOptional: true,
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
        });
    }
}
