import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

import { config, loadConfig } from './Config';

const server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
        simpleParser(stream, {}, (err, parsed) => {
            console.warn(`Email from ${session.user} / ${parsed.from.text}`);
            // console.log(parsed);
            console.log(parsed.subject);
            console.log(parsed.text);
            callback();
        });
    },
    onAuth(auth, session, callback) {
        console.warn('Access token:', auth.accessToken);
        console.warn('Username: ', auth.username);
        console.warn('Password: ', auth.password);

        if (auth.accessToken === config.apiKey || auth.password === config.apiKey) {
            return callback(null, { user: auth.username });
        }

        if (auth.accessToken) {
            return callback(null, { data: { error: 'Invalid login' }});
        }

        return callback(new Error('Invalid login'), null);
    },
    authMethods: ['XOAUTH2', 'LOGIN']
});

export const start = () => {
    loadConfig();
    server.listen(config.port, config.bindIp);
};
