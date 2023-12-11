import { loadConfig } from './Config';
import { Smtp } from './Smtp';

export const start = () => {
    loadConfig();
    const smtp = new Smtp();
    smtp.start();
};
