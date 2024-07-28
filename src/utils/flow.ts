import { HTTP } from '../vendor/open-api';

export async function getFlowHeaders(url: string) {
    const http = HTTP({
        headers: {
            'User-Agent': 'clash.meta',
        }
    });
    const { headers } = await http.get(url);
    return headers.get('SUBSCRIPTION-USERINFO');
}
