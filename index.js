require('dotenv').config();
const { ethers } = require('ethers');
const { bot, sendMsg } = require('./telegrambot.js');

const every_period = 250
const succed_period = 10000
const failed_period = 20000
const wait_tg_send_msg = 1000

will_show_once = false
const chains = JSON.parse(process.env.CHAIN)
const wallets = process.env.WALLET.split(' ')

const providers = []
const chain_names = []
const limit_balances = []
const explorer_link = {
    "BSC Mainnet" : "https://bscscan.com/address/",
    "BSC Testnet" : "https://testnet.bscscan.com/address/"
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const runWithTimeout = (func, timeout) => {
    return Promise.race([
        func(),
        new Promise((resolve, reject) =>
            setTimeout(() => reject('RPC Server Response Timeout!'), timeout)
        )
    ])
}

const get_balance = async (provider, chain_name, limit_balance) => {
    try {
        process.stdout.write(chain_name)
        for (let j = 0; j < wallets.length; j++) {
            process.stdout.write('.')
            const balance = await (await provider).getBalance(wallets[j])
            process.stdout.write(' ')

            if (balance > limit_balance) {
                console.log(chain_name + '-' + wallets[j] + ': ' + ethers.formatEther(balance))
                sendMsg("💰 <b>Overbalance!</b>", {Network: chain_name, Address: wallets[j], Balance: ethers.formatEther(balance), Link: explorer_link[chain_name]+wallets[j]})
                await sleep(succed_period)
            }

            if (will_show_once) {
                sendMsg("🏃‍♀️ <b>Running...</b>", {Network: chain_name, Address: wallets[j], Balance: ethers.formatEther(balance), Limit: ethers.formatEther(limit_balance), Link: explorer_link[chain_name]+wallets[j]})
                will_show_once = false
            }
        }
        return true
    } catch (error) {
        console.error("Alerts:", error)
        sendMsg("💬 <b>Alerts!</b>", error)
        return false
    }
}

const loop = async () => {
    for (let z = 0; z < chains.length; z++) {
        await get_balance(providers[z], chain_names[z], limit_balances[z])
        await sleep(every_period)
    }
}

(async () => {
    for (let i = 0; i < chains.length; i++) {
        chain_names.push(chains[i]['Name'])
        providers.push(new ethers.WebSocketProvider(chains[i]['Url']))
        limit_balances.push(ethers.parseUnits('' + chains[i]['Limit'], 'ether'))
    }

    bot.on('message', (msg) => {
        if (msg.text.toString().indexOf("config") === 0)
            sendMsg('📝 <b>Config</b>', {Wallets: wallets, Network: chains})
        else if (msg.text.toString().indexOf("status") === 0)
            bot.sendMessage(msg.chat.id, '🏃‍♀️ <b>Running...</b>', {parse_mode: 'html'})
        else if (msg.text.toString().indexOf("?") === 0)
            will_show_once = true
    })

    const date = new Date();
    sendMsg("🏹 <b>Started!</b>", {Timestamp: date.toUTCString()})

    while (true) {
        try {
            await runWithTimeout(loop, failed_period)
                // .then(result => console.log(result))
                // .catch(error => console.error(error));
        } catch (err) {
            console.error("Terminated:", err)
            sendMsg("💥 <b>Terminated!</b>", {Reason: err})
            await sleep(wait_tg_send_msg)
            process.exit()
        }
    }
})();