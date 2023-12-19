import axios, { AxiosInstance } from 'axios';
import { Logger } from 'winston';

import { config } from './Config';
import { getLogger } from './Logger';

export class Gotify {
    private readonly client: AxiosInstance;
    private readonly logger: Logger;

    constructor() {
        this.logger = getLogger(this.constructor.name);
        this.client = this.createClient();
    }

    private createClient(): AxiosInstance {
        const client = axios.create({
            baseURL: config.gotifyUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${config.gotifyToken}`
            }
        });

        client.interceptors.response.use((res => res), (err) => {
            if (err) {
                this.logger.error(`Gotify error: ${err.message}`);
                this.logger.error(err);
                throw err;
            }
        });

        return client;
    }

    async postMessage(title: string, message: string): Promise<void> {
        this.logger.info(`Posting message to Gotify: ${title}`);
        await this.client.post('/message', {
            title,
            message
        });
    }
}
