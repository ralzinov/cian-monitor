import * as admin from 'firebase-admin';
import {requestParamsV1} from './data-fetch.const';
import {ICianOfferValue, IOffer} from './interfaces/IOffer';
import axios, {AxiosResponse} from 'axios';

const CHAT_ID = 170903698;

function convertImgToV2Api(url: string) {
    return url.replace('-2.jpg', '-1.jpg');
}

function mapResponse(response: AxiosResponse, existingData: Dict<IOffer>): Dict<IOffer> {
    const data = Object.values(response.data.data?.offersSerialized) as ICianOfferValue[];
    if (!Array.isArray(data)) {
        console.log('Response is not an array');
        console.error(JSON.stringify(response.data.data));
    }

    return data
        .filter((item) => !existingData[item.id])
        .reduce((acc, item) => {
            const {id, added, photos, link, phone, price, agent_fee, deposit, rooms_count, underground} = item;
            acc[id] = {
                id,
                added: added.strict,
                fullUrl: `https://www.cian.ru${link}`,
                roomsCount: rooms_count,
                underground: underground[0]?.name,
                photos: photos.map(({img}) => convertImgToV2Api(img)),
                agentFee: agent_fee,
                price: price.rur,
                deposit,
                phone
            };
            return acc;
        }, {} as Dict<IOffer>);
}

export const dataFetchService = async () => {
    const dataRef = admin.database().ref(`data/${CHAT_ID}`);
    const configRef = admin.database().ref(`config/${CHAT_ID}`);
    const config = (await configRef.once('value')).val();

    if (!config) {
        console.error(`No configuration for user #${CHAT_ID}`);
        return;
    }

    try {
        const response = await axios(requestParamsV1(config));
        const existingData = (await dataRef.once('value')).val() || {} as Dict<IOffer>;
        const newData = mapResponse(response, existingData);
        const dataLen = Object.keys(newData).length;
        if (dataLen > 0) {
            await dataRef.update(newData);
            console.log(`Got ${dataLen} new item(s) for user #${CHAT_ID}`);
        } else {
            console.log(`No new data for user #${CHAT_ID}`);
        }
    } catch (error) {
        console.log(error);
        if (error.status) {
            console.error(`Request error: ${error.status}`);
        } else {
            console.log(`Request error: ${JSON.stringify(error, null, 4)}`);
        }
    }
    return null;
};
