import * as TelegramBot from 'node-telegram-bot-api';
import * as functions from 'firebase-functions';
import {Change, EventContext} from 'firebase-functions/lib/cloud-functions';
import {DataSnapshot} from 'firebase-functions/lib/providers/database';
import {IOffer} from '../data-fetch/interfaces/IOffer';

const CHAT_ID = 170903698;

function getDiff(before: Dict<IOffer>, after: Dict<IOffer>): [string, IOffer][] {
    const prevValue = Object.entries(before) as [string, IOffer][];
    const currentValue = Object.entries(after) as [string, IOffer][];

    // Item(s) was deleted from DB, no need to make diff
    if (prevValue.length >= currentValue.length) {
        return [];
    }

    // if updated/created: after > before
    return currentValue.filter(([id]) => {
        return !before[id];
    });
}

function toMediaGroup(item: IOffer): TelegramBot.InputMedia[] {
    return item.photos
        .slice(0, 10)
        .map((url) => ({
            type: 'photo',
            media: url
        }));
}

// https://core.telegram.org/bots/api#html-style
function getMessageText(item: IOffer): string {
    return `${item.roomsCount}-комн, ${item.price} <b>${item.agentFee}</b>% ` +
        `<a href="${item.fullUrl}"><b>${item.underground || ''}</b></a>`;
}

export const telegramNotifyService = (change: Change<DataSnapshot>, context: EventContext) => {
    const before = (change.before.val() || {}) as Dict<IOffer>;
    const after = (change.after.val() || {}) as Dict<IOffer>;
    const diff = getDiff(before, after);
    if (diff.length === 0) {
        console.log('Nothing new to notify');
        return null;
    }
    console.log(`Got ${diff.length} new items for user #${context.params.id}\n`);

    const token = functions.config().telegram.token;
    const bot = new TelegramBot(token);

    return diff.reduce((end, [, item], index) => {
        return end.then(() => new Promise((res) => {
            setTimeout(() => {
                console.log(`Sending item #${item.id} ${(new Date()).toLocaleTimeString()}`);
                const gallery = toMediaGroup(item);
                // setting caption to the first item in gallery to
                // make telegram show it as message caption
                gallery[0].parse_mode = 'HTML';
                gallery[0].caption = getMessageText(item);
                bot.sendMediaGroup(CHAT_ID, gallery)
                    .then(() => console.log(`Item #${item.id} has been sent`))
                    .catch((e) => {
                        const {description, error_code} = e.response.body || {};
                        console.error(`Failed to send item #${item.id}`, error_code, description);
                    })
                    .finally(res);
            }, index && 2000);
        }));
    }, Promise.resolve());
};
