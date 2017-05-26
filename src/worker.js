const request = require('request');
const TelegramService = require('./notify-services/telegram.service.js');

const QUERY_PARAMS = require('./../queryParams.json');
const REQUEST_HTTP_PARAMS = {
    method: 'POST',
    uri: 'https://www.cian.ru/cian-api/site/v1/offers/search/',
    body: JSON.stringify(QUERY_PARAMS),
    headers: {
        'Host': 'www.cian.ru',
        'Origin': 'https://www.cian.ru',
        'Content-Type': 'application/json;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};
const POLL_PERIOD_MINUTES = 15;

class Worker {
    init() {
        console.log('Start');
        this.offerIds = [];
        this.notifyService = new TelegramService();
        this.notifyService.init();

        this.fetchAndProcessData(REQUEST_HTTP_PARAMS);
        this.poll(REQUEST_HTTP_PARAMS);
    }

    poll(options) {
        this.pollTimeoutId = setTimeout(() => {
            console.log('Requesting offers');

            this.fetchAndProcessData(options);
            this.poll(options);
        }, POLL_PERIOD_MINUTES * 60 * 1000);
    }

    stopPolling () {
        clearTimeout(this.pollTimeoutId);
    }

    processData(offerIds, data) {
        console.log('Processing response data');

        offerIds.forEach((offerId, index) => {
            if (!~this.offerIds.indexOf(offerId)) {
                console.log(`${index} Notifying with one new offer. ID: ${offerId}`);

                this.offerIds.push(offerId);
                this.notify(offerId, data[offerId]);
            }
        });
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
            console.error(data.statusCode);
        }
    }

    fetchAndProcessData(options) {
        request(options, this.handleResponse.bind(this))
    }

    notify (offerId, offerData) {
        this.notifyService.send(offerId, offerData);
    }
}

const worker = new Worker();
worker.init();