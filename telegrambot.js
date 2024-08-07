// https://gist.github.com/Sinequanonh/f5625a2807f89ce4f6634cd3b1ab65a0
// https://github.com/hosein2398/node-telegram-bot-api-tutorial
// https://www.alphr.com/find-chat-id-telegram/

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const chatId = process.env.CHAT_ID;
const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });
bot.on("polling_error", console.log);

const sendMsg = (message, data) => {
  try {
    bot.sendMessage(chatId, message + '\n\n<pre>' + JSON.stringify(data, null, 2) + '</pre>', {
      parse_mode: 'html'
    });
  } catch (err) {
    console.error('Failed to send a Telegram notification:', err);
    process.exit();
  }
}

module.exports = {
  sendMsg,
  bot
}