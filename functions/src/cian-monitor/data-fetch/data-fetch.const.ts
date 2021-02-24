import {AxiosRequestConfig} from 'axios';

export const requestParamsV2 = (config: object): AxiosRequestConfig => ({
    method: 'post',
    url: 'https://api.cian.ru/search-offers/v2/search-offers-desktop/',
    data: JSON.stringify({jsonQuery: config}),
    headers: {
        'Origin': 'https://www.cian.ru',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (K' +
            'HTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
});

export const requestParamsV1 = (config: object): AxiosRequestConfig => ({
    method: 'post',
    url: 'https://www.cian.ru/cian-api/site/v1/offers/search/',
    data: JSON.stringify(config),
    headers: {
        'Host': 'www.cian.ru',
        'Origin': 'https://www.cian.ru',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (K' +
            'HTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
});
