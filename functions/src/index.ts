import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {dataFetchService} from './cian-monitor/data-fetch';
import {telegramNotifyService} from './cian-monitor/telegram-notify/telegram-notify.service';

admin.initializeApp();

export const dataFetch = functions.pubsub.schedule('every 5 minutes').onRun(dataFetchService);
export const notify = functions.database.ref('data/{id}').onWrite(telegramNotifyService);
