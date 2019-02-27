const xml2json     = require('xml2json');
const request      = require('request');
const sync_request = require('sync-request');
const Discord      = require('discord.js');
const config       = require('./config.json');
const client       = new Discord.Client();

require('log-timestamp');

client.on('ready', () => {
	console.log('Discord client ready!');
});

client.on('message', message => {
	if (message.author.bot) {
		return;
	}

	if(config.channels.includes(message.channel.id)) {
		try {
			console.log('Received \'' + message + '\' in channel ' + message.channel.id);
			let msg = message.content.toLowerCase();
			let args = msg.split(" ");
			args.splice(0, 1);
			if(msg.toLowerCase().startsWith('!info ') || msg.toLowerCase() == '!info') {
				if(args.length == 1) {
					console.log('Checking info for ' + args[0]);
					request(config.api_url + '/cardinfo/' + args[0], function (error, response, body) {
						if(error) {
							console.log('Failed to check info for ' + args[0] + ' API Error');
							console.log(error);
							message.reply('An error occurred! Please try again later');
							return;
						}
						try {
							let data = JSON.parse(body);
							
							if(data.success) {
								console.log('Success');
								let result = '\nCard type: ' + data.data.card_type;
								result += '\nName: ' + data.data.name;
								if(data.data.family != null) {
									result += '\nFamily: ' + data.data.family;
								}

								if(data.data.type != null) {
									result += '\nType: ' + data.data.type;
								}
								result += '\nRarity: ' + data.data.price_data.rarity;
								result += '\nSet: ' + data.data.price_data.name;

								message.reply(result);
							} else {
								if(data.error) {
									console.log('Failed to find card ' + args[0].toUpperCase() + '. data.message: ' + data.message);
									message.reply('An error occurred! Please try again later');
								} else {
									console.log('Card with print tag ' + args[0].toUpperCase() + ' not found. data.message: ' + data.message);
									message.reply('Could not find card with print tag \'' + args[0].toUpperCase() + '\'');
								}
							}
						} catch(err) {
							console.log(err);
							message.reply('Error: Exception thrown! Please try again later');
						}
					});
				} else {
					message.reply('Useage: !info <PrintTag>');
				}
			} else if(msg.toLowerCase().startsWith('!price ') || msg.toLowerCase() == '!price') {
				if(args.length == 1) {
					console.log('Checking price for ' + args[0]);
					request(config.api_url + '/cardprice/' + args[0], function (error, response, body) {
						if(error) {
							console.log('Failed to check price for ' + args[0] + ' API Error');
							console.log(error);
							message.reply('An error occurred! Please try again later');
							return;
						}
						try {
							let data = JSON.parse(body);
						
							if(data.success) {
								console.log('Success');
								if(data.data.cardmarket.lowest_price != undefined)  {
									let result = '\nCard type: ' + data.data.card.card_type;
									result += '\nName: ' + data.data.card.name;
									result += '\nSet: ' + data.data.card.price_data.name;
									result += '\nRarity: ' + data.data.card.price_data.rarity;
									result += '\nCardmarket price: ' + data.data.cardmarket.lowest_price + ' €';

									let priceSek = null;
									console.log('checking price in SEK');
									try {
										let res = sync_request('GET', 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
										let ratesJSON = JSON.parse(xml2json.toJson(res.getBody()));
										let rates = ratesJSON['gesmes:Envelope'].Cube.Cube.Cube;
										let rateSEK = null;

										for(let i = 0; i < rates.length; i++) {
											if(rates[i].currency == 'SEK') {
												rateSEK = parseFloat(rates[i].rate);
												break;
											}
										}

										if(rateSEK == null) {
											console.warn('Failed to get SEK rate');
										} else {
											console.log('SEK Rate: ' + rateSEK);
											let priceSekOriginal = data.data.cardmarket.lowest_price * rateSEK;
											priceSek = priceSekOriginal.toFixed(2);

											console.log('Full price: ' + priceSekOriginal + ' SEK. Price: ' + priceSek + ' SEK');

										}
									} catch(err) {
										console.log(err);
									}

									if(priceSek != null) {
										result += '\nCardmarket price: ' + priceSek + ' SEK';
									}

									message.reply(result);
								}
							} else {
								if(data.cardmarket_error) {
									console.log('Failed to find cardmarket price for ' + args[0].toUpperCase() + '. data.message: ' + data.message);
									message.reply('Failed to extract cardmarket price!');
								} else if(data.error) {
									console.log('Failed to find card ' + args[0].toUpperCase() + '. data.message: ' + data.message);
									message.reply('An error occurred! Please try again later');
								} else {
									if(data.data == undefined) {
										console.log('Card with print tag ' + args[0].toUpperCase() + ' not found. data.message: ' + data.message);
										message.reply('Could not find card with print tag \'' + args[0].toUpperCase() + '\'');
									} else {
										console.log('Failed to find cardmarket price for ' + args[0].toUpperCase() + '. data.message: ' + data.message);
										message.reply('Failed to find cardmarket price!');
									}
								}
							}
						} catch(err) {
							console.log(err);
							message.reply('Error: Exception thrown! Please try again later');
						}
					});
				} else {
					message.reply("Useage: !price <PrintTag>");
				}
			} else if(msg.toLowerCase().startsWith('!help ') || msg.toLowerCase() == '!help') {
				message.reply('\n!help\n!info <PrintTag>\n!price <PrintTag>');
			} else {
				message.reply('Unknown command. Use !help for a list of commands');
			}
		} catch(err) {
			console.log(err);
			message.reply('Error: Exception thrown! Please try again later');
		}
	}
});

console.log('Connecting to discord...');
client.login(config.discord_token);