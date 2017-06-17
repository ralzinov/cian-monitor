# Cian-Monitor
NodeJS Service that poll cian.ru with parameters and send notify if new item is available. Currently telegram notify is only available.

### How to use it:
1. Make search request with parameters you need. Save request json object to queryParameters.js
2. Create telegram bot and set botToken in config.js
3. Run `npm install` and then `npm run poll`
4. Type any command f.e. /help to bot to init service
5. Type one of command to manage service
6. ???
7. PROFIT

### Commands:
- `/help` - display help
- `/pause` - pause service polling
- `/resume` - resume service polling
- `/state` - show service status
- `/setinterval <minutes>` - set polling interval in minutes. Should be greater than zero
