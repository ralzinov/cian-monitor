const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '383953254:AAFVT2ay9VFlgjixMCHWGDhKxYrtOK-IF1c';
const BOT_CHAT_ID = 170903698;
const COMMANDS = ['ping'];
const CIAN_HOST = 'https://www.cian.ru';

class TelegramService {
    init () {
        this.bot = new TelegramBot(BOT_TOKEN, {
            polling: true
        });

        COMMANDS.forEach((command) => {
            const regexp = new RegExp(`/${command} (.+)`);

            this.bot.onText(regexp, (msg, match) => {
                const chatId = msg.chat.id;
                const command = match[1];

                this.handleCommand(chatId, command);
            });
        });
    }

    handleCommand(chatId, command) {
        this.bot.sendMessage(chatId, command)
            .then(() => {
                console.log('Sent');
            })
            .catch((e) => {
                console.log(`Sending error: ${e}`);
            })
    }

    send (offerId, offerData) {
        const link = `${CIAN_HOST}${offerData.link}`;
        this.bot.sendMessage(BOT_CHAT_ID, link)
            .then(() => {
                console.log(`Sent offer with id: ${offerId}`);
            })
            .catch((e) => {
                console.log(`Sending error: ${e}`);
            })
    }
}

module.exports = TelegramService;
