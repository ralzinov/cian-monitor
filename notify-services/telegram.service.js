const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const {POLLING_STATE, PAUSED_STATE} = require('../constants');

const COMMANDS = {
    START: 'start',
    HELP: 'help',
    RESUME: 'resume',
    PAUSE: 'pause',
    SET_INTERVAL: 'setinterval',
    STATE: 'state'
};

const CIAN_HOST = 'https://www.cian.ru';

const getHelpMessage = (chatId) => `Your chat id: ${chatId}\n\n`+
    'Commands: \n' +
    `To resume polling please type: /${COMMANDS.RESUME} \n` +
    `To pause polling please type: /${COMMANDS.PAUSE} \n` +
    `To set polling interval: /${COMMANDS.SET_INTERVAL} <minutes> \n` +
    `To show state, please type: /${COMMANDS.STATE} \n` +
    `To show this help please type: /${COMMANDS.HELP} \n`;

class TelegramService {
    constructor(worker) {
        this.worker = worker;
    }

    init() {
        let resolveInit = () => console.log('noop');
        const deffered = new Promise((res) => resolveInit = res);

        this.bot = new TelegramBot(config.botToken, {
            polling: true
        });

        Object.keys(COMMANDS).forEach((key) => {
            const command = COMMANDS[key];
            const regexp = new RegExp(`(/${command}) ?(.+)?`);

            this.bot.onText(regexp, (msg, match) => {
                const chatId = msg.chat.id;
                const command = match[1];
                const value = match[2];

                if (!this.chatId) {
                    this.chatId = chatId;
                    resolveInit();
                }

                this.handleCommand(command, value);
            });
        });

        return deffered;
    }

    handleCommand(command, value) {
        let responseMessage = 'Unknown command. Please type /help to show manual';
        console.log(`Got command: ${command} ${value || ''}`);

        if (this.isCommand(command, COMMANDS.HELP) || this.isCommand(command, COMMANDS.START)) {
            responseMessage = getHelpMessage(this.chatId);
        } else if (this.isCommand(COMMANDS.RESUME)) {
            if (this.worker.state !== POLLING_STATE) {
                this.worker.poll();
                responseMessage = 'Service resumed polling. To pause it please type: /pause';
            } else {
                responseMessage = 'Service is polling already. To pause it type: /pause';
            }

        } else if (this.isCommand(command, COMMANDS.PAUSE)) {
            if (this.worker.state !== PAUSED_STATE) {
                this.worker.stopPolling();
                responseMessage = 'Service paused. To resume polling, please type: /resume';
            } else {
                responseMessage = 'Service paused already. To resume it type: /resume';
            }

        } else if (this.isCommand(command, COMMANDS.SET_INTERVAL)) {
            const interval = parseFloat(value, 10);

            if (!isNaN(interval) && interval > 0) {
                this.worker.pollingInterval = interval;
                responseMessage = `Polling interval is ${interval} min now`;
            } else {
                responseMessage = 'Incorrect interval value specified. Interval should be number and greater than zero';
            }
        } else if (this.isCommand(command, COMMANDS.STATE)) {
            responseMessage = `Status: ${this.worker.state.toUpperCase()}\nPolling interval: ${this.worker.pollingInterval} min`;
        }

        this.sendMessage(responseMessage)
            .then(() => console.log('Done.'))
            .catch((e) => console.log(`Error while sending message: \n${JSON.stringify(e, null, 4)}`));
    }

    sendOffer(offerId, offerData) {
        const link = `${CIAN_HOST}${offerData.link}`;
        this.sendMessage(link)
            .then(() => {
                console.log(`Sent offer with id: ${offerId}`);
            })
            .catch((e) => {
                console.log(`Sending error: ${e}`);
            });
    }

    sendMessage(message) {
        return this.bot.sendMessage(this.chatId, message);
    }

    isCommand(str, command) {
        return `/${command}` === str;
    }
}

module.exports = TelegramService;
