import { RequestInit, Response } from '@cloudflare/workers-types';
import { DB } from '../db';

export class OpenAPI {
    name: string;
    debug: boolean;
    http;
    constructor(name = 'untitled', debug = false) {
        this.name = name;
        this.debug = debug;

        this.http = HTTP();

        const delay = (t, v) =>
            new Promise(function (resolve) {
                setTimeout(resolve.bind(null, v), t);
            });

        Promise.prototype.delay = async function (t) {
            const v = await this;
            return await delay(t, v);
        };
    }

    async write(data: any, key: string): Promise<void> {
        this.log(`SET ${key}`);
        if (key.indexOf('#') !== -1) {
            key = key.substring(1);
        }
        data = JSON.stringify(data);
        try {
            await DB
                .insertInto('sub_store')
                .values([{ key, data }])
                .onConflict((oc) => oc.column('key').doUpdateSet({ data }))
                .execute();
        } catch (err) {
            console.log(err);
            console.log((err as any).cause);
            throw err;
        }
    }

    async read(key: string): Promise<any> {
        this.log(`READ ${key}`);
        if (key.indexOf('#') !== -1) {
            key = key.substring(1);
        }
        const result = await DB.selectFrom('sub_store').selectAll().where('key', '=', key).executeTakeFirst();
        return !result ? null : JSON.parse(result.data);
    }

    async delete(key: string) {
        this.log(`DELETE ${key}`);
        if (key.indexOf('#') !== -1) {
            key = key.substring(1);
        }
        await DB.deleteFrom('sub_store').where('key', '=', key).execute();
    }

    // notification
    notify(title: string, subtitle = '', content = '', options = {}) {
        const openURL = options['open-url'];
        const mediaURL = options['media-url'];

        const content_ =
            content +
            (openURL ? `\n点击跳转: ${openURL}` : '') +
            (mediaURL ? `\n多媒体: ${mediaURL}` : '');
        console.log(`${title}\n${subtitle}\n${content_}\n\n`);
    }

    // other helper functions
    log(msg: any) {
        if (this.debug) console.log(`[${this.name}] LOG: ${msg}`);
    }

    info(msg: any) {
        console.log(`[${this.name}] INFO: ${msg}`);
    }

    error(msg: any) {
        console.log(`[${this.name}] ERROR: ${msg}`);
    }

    wait(millisec: number) {
        return new Promise((resolve) => setTimeout(resolve, millisec));
    }
}

export function HTTP(defaultOptions = {}): { get: (any), post: (any), put: (any), delete: (any), head: (any), options: (any), patch: (any)} {
    const methods = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'HEAD',
        'OPTIONS',
        'PATCH',
    ];
    async function send(method: string, options: RequestInit|string): Promise<Response | null | undefined> {
        console.log(`还原备份中66666..`+options);
        const baseURL = defaultOptions.baseURL;
        const urlPattern = /^(https?:\/\/)/i;
        let url = typeof options === 'string' ? options : options.url;
        if (baseURL) {
            if (!urlPattern.test(url)) {
                url = baseURL + (url.startsWith('/') ? url : '/' + url);
            }
        }
      
        if (typeof options === 'string') {
            options = { method: method };
        } else {
            options.method = method;
        }
      
        console.log(`还原备份中.3222..`+url);
        options = { ...defaultOptions, ...options };
    
        return await fetch(url, options).then(
          (res) => {
                console.log(`还原备份中.3222..` + JSON.stringify(options));
                console.log(`还原备份中.3222..状态码: ` + res.status);
        
                if (res.ok) {
                   
                   return res;
                } else {
                    
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
            }
        ).catch(
            (e) => {
                console.log(`还原备份中出错: ` + e.message);
                throw e; // 重新抛出错误，让调用者知道发生了错误
            }
        );
    }
    const http = {};
    methods.forEach(
        (method) =>
            (http[method.toLowerCase()] = async (options: any) => await send(method, options)),
    );
    return http;
}
