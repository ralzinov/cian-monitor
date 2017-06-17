const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const {POLLING_STATE, PAUSED_STATE} = require('../constants');

const COMMANDS = ['help', 'start', 'pause', 'setinterval'];
const CIAN_HOST = 'https://www.cian.ru';

const getHelpMessage = (chatId) => `
Your chat id: ${chatId}
Commands:
To start polling please type: /start
To pause polling please type: /pause
To set polling interval: /setinterval <minutes>
To show this help please type: /help
`;

class TelegramService {
    constructor(worker) {
        this.worker = worker;
    }

    init() {
        this.bot = new TelegramBot(config.botToken, {
            polling: true
        });

        COMMANDS.forEach((command) => {
            const regexp = new RegExp(`(/${command}) ?(.+)?`);

            this.bot.onText(regexp, (msg, match) => {
                const chatId = msg.chat.id;
                const command = match[1];
                const value = match[2];

                this.handleCommand(chatId, command, value);
            });
        });
    }

    handleCommand(chatId, command, value) {
        let responseMessage = 'Unknown command. Please type /help to show manual';
        console.log(`Got command: ${command} ${value || ''}`);

        if (command === '/help') {
            responseMessage = getHelpMessage(chatId);
        } else if (command === '/start') {
            if (this.worker.state !== POLLING_STATE) {
                this.worker.poll();
                responseMessage = 'Service started polling. To pause it please type: /pause';
            } else {
                responseMessage = 'Service is started already. To pause it type: /pause';
            }

        } else if (command === '/pause') {
            if (this.worker.state !== PAUSED_STATE) {
                this.worker.stopPolling();
                responseMessage = 'Service paused. To start polling again, please type: /start';
            } else {
                responseMessage = 'Service paused already. To start it type: /start';
            }

        } else if (command === '/setinterval') {
            const interval = parseFloat(value, 10);

            if (!isNaN(interval) && interval > 0) {
                this.worker.pollingInterval = interval;
                responseMessage = `Polling interval is ${interval} min now`;
            } else {
                responseMessage = 'Incorrect interval value specified. Interval should be number and greater than zero';
            }
        }

        this.sendMessage(chatId, responseMessage)
            .then(() => console.log('Sent message'))
            .catch((e) => console.log(`Sending message error: ${e}`));
    }

    sendOffer(offerId, offerData) {
        console.log(`Sent offer with id: ${offerId}`);

        const link = `${CIAN_HOST}${offerData.link}`;
        this.sendMessage(config.chatId, link)
            .then(() => {
                console.log(`Sent offer with id: ${offerId}`);
            })
            .catch((e) => {
                console.log(`Sending error: ${e}`);
            });
    }

    sendMessage(chatId, message) {
        return this.bot.sendMessage(chatId, message);
    }
}

module.exports = TelegramService;
