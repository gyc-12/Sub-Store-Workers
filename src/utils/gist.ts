import { HTTP } from '../vendor/open-api';
/**
 * Gist backup
 */
export default class Gist {
    constructor({ token, key }) {
        console.log(`还原32423备份中...`+token+key);
        this.http = HTTP({
            baseURL: 'https://api.github.com',
            headers: {
                Authorization: `token ${token}`,
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.141 Safari/537.36',
            },
            events: {
                onResponse: (resp) => {
                    if (/^[45]/.test(String(resp.statusCode))) {
                        console.log(`还原备份中.222222..`);
                        return Promise.reject(
                            `ERROR: ${JSON.parse(resp.body).message}`,
                        );
                    } else {
                        console.log(`还原备份中.3222..`);
                        return resp;
                    }
                },
            },
        });
        console.log(`还原备份中.1111..`);
        this.key = key;
    }

    async locate() {
        console.log(`还原备份中???..`);
        return this.http.get('/gists').then(async (response) => {
            const text = await response.text();
            // 假设 response 已经是解析过的 JSON。如果不是，则需要解析
            const gists = JSON.parse(text); 
            console.log(Array.isArray(gists))
            for (let g of gists) {
                console.log(`处理 gist: ${g.id}, 描述: ${g.description}`);
                if (g.description === this.key) {
                    console.log(`找到匹配的 gist: ${g.id}`);
                    return g.id;
                }
            }
            console.log(`未找到匹配 key '${this.key}' 的 gist`);
            return null; // 或者抛出一个错误，取决于您的需求
        }).catch(error => {
            console.error('获取 gists 时发生错误:', error);
            throw error; // 重新抛出错误以便上层处理
        });
    }

    async upload(files) {
        const id = await this.locate();

        if (id === -1) {
            // create a new gist for backup
            return this.http.post({
                url: '/gists',
                body: JSON.stringify({
                    description: this.key,
                    public: false,
                    files,
                }),
            });
        } else {
            // update an existing gist
            return this.http.patch({
                url: `/gists/${id}`,
                body: JSON.stringify({ files }),
            });
        }
    }

    async download(filename) {
        console.log(`还原备份中..2222.`);
        const id = await this.locate();
        console.log(`还原备份中..23423423.`);
        if (id === -1) {
            return Promise.reject('未找到Gist备份！');
        } else {
            try {
                const { files } = await this.http
                    .get(`/gists/${id}`)
                    .then((resp: Response) => resp.json());
                const url = files[filename].raw_url;
                return await this.http.get(url).then((resp: Response) => resp.json());
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }
}
