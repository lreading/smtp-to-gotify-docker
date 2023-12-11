import dotenv from 'dotenv';
import { IntSecret, StringSecret } from '@thenerdyhick/ts-secrets';

export const config = {
    port: null as number,
    bindIp: null as string
};

export const loadConfig = () => {
    dotenv.config();
    config.port = new IntSecret({ name: 'PORT', default: 2525 }).load();
    config.bindIp = new StringSecret({ name: 'BIND_IP', default: '0.0.0.0' }).load();
};
