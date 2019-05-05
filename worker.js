const request = require('request');
const config = require('./config');
const TelegramService = require('./notify-services/telegram.service.js');
const {POLLING_STATE, PAUSED_STATE, STANDBY_STATE} = require('./constants');

const REQUEST_PARAMS = {
    method: 'POST',
    uri: 'https://www.cian.ru/cian-api/site/v1/offers/search/',
    body: JSON.stringify(config.queryParams),
    headers: {
        'Host': 'www.cian.ru',
        'Origin': 'https://www.cian.ru',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};

class Worker {
    init() {
        console.log('Init worker');
        this.offerIds = [];
        this.notifyService = new TelegramService(this);
        this.pollingInterval = config.pollPeriodMinutes;
        this.state = STANDBY_STATE;

        this.notifyService.init()
            .then(() => this.poll());
    }

    poll() {
        this.state = POLLING_STATE;
        this.fetchAndProcessData(REQUEST_PARAMS);

        this.pollTimeoutId = setTimeout(() => {
            console.log(`Requesting offers. ${(new Date()).toLocaleString('ru')}`);

            this.fetchAndProcessData(REQUEST_PARAMS);
            this.poll();
        }, this.pollingInterval * 60 * 1000);
    }

    stopPolling() {
        this.state = PAUSED_STATE;
        console.log('Pausing polling');
        clearTimeout(this.pollTimeoutId);
        this.pollTimeoutId = null;
    }

    processData(offerIds, data) {
        console.log('Processing response...');
        const ids = offerIds.filter((id) => !this.offerIds.includes(id));
        if (ids.length > 0) {
            return ids.forEach((offerId, index) => {
                this.offerIds.push(offerId);

                console.log(`${index} Notifying with one new offer. ID: ${offerId}`);
                this.notify(offerId, data[offerId]);
            });
        }

        console.log('No new offers.');
    }

    handleResponse(error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                const data = JSON.parse(body).data;
                this.processData(data.offerIds, data.offersSerialized);
            } catch (e) {
                console.error(`Response parsing error: ${e}`);
            }
        } else {
            console.error(`Request error: ${response.statusCode}`);
        }
    }

    fetchAndProcessData(options) {
        console.log('Fetching data...');
        request(options, this.handleResponse.bind(this));
    }

    notify(offerId, offerData) {
        this.notifyService.sendOffer(offerId, offerData);
    }
}

const worker = new Worker();
worker.init();
