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
        // auth.accessToken = Buffer.from(auth.accessToken, 'base64').toString();
        console.warn('Access token:', auth.accessToken);
        console.warn('Username: ', auth.username);
        console.warn('Password: ', auth.password);
        // If failed, do the callback with { data: 'Invalid login' }
        // callback(null, { user: 'test_user' });
        callback(null, { data: { error: 'Invalid login' }});
    },
    authMethods: ['XOAUTH2', 'LOGIN']
});

export const start = () => {
    loadConfig();
    server.listen(config.port, config.bindIp);
};
