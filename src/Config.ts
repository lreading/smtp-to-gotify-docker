import dotenv from 'dotenv';
import { IntSecret, StringSecret } from '@thenerdyhick/ts-secrets';

export const config = {
    port: 2525,
    bindIp: '',
    apiKey: '',
    gotifyToken: '',
    gotifyUrl: ''
};

export const loadConfig = () => {
    dotenv.config();
    config.port = new IntSecret({ name: 'PORT', default: 2525 }).load();
    config.bindIp = new StringSecret({ name: 'BIND_IP', default: '0.0.0.0' }).load();
    config.apiKey = new StringSecret({ name: 'API_KEY', required: true }).load();
    config.gotifyToken = new StringSecret({ name: 'GOTIFY_TOKEN', required: true }).load();
    config.gotifyUrl = new StringSecret({ name: 'GOTIFY_URL', required: true }).load();
};
