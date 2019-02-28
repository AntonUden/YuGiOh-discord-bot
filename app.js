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

	if(config.channels.includes(message.channel.id) || message.guild === null) {
		try {
			if(message.guild === null) {
				console.log('Received \'' + message + '\' in dm from ' + message.author.username);
			} else {
				console.log('Received \'' + message + '\' in channel ' + message.channel.id+ ' from '  + message.author.username);
			}
			let msg = message.content.toLowerCase();
			let args = msg.split(" ");
			args.splice(0, 1);
			if(msg.startsWith('!info ') || msg == '!info') {
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

								if(data.data.text != undefined) {
									result += '\nText: ' + data.data.text;
								} else {
									console.log('Failed to find card text for ' + args[0]);
								}

								if(data.data.atk != undefined) {
									result += '\nATK: ' + data.data.atk;
								}

								if(data.data.def != undefined) {
									result += '\nDEF: ' + data.data.def;
								}

								if(data.data.level != undefined) {
									result += '\nLevel: ' + data.data.level;
								}

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
			} else if(msg.startsWith('!price ') || msg == '!price') {
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
									if(data.data.level != undefined) {
										result += '\nLevel: ' + data.data.level;
									}

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
								// ErrNo: 0: No error, 1: Card not found, 2: Failed to find card, 3: Failed to find cardmarket versions, 4: Failed to find cardmarket version, 5: Failed to find cardmarket price
								if(data.success == false) {
									switch (data.errno) {
										case 1:
											console.log('Card with print tag ' + args[0].toUpperCase() + ' not found. data.message: ' + data.message);
											message.reply('Could not find card with print tag \'' + args[0].toUpperCase() + '\'');
											break;
										case 2:
											console.log('Failed to find card ' + args[0].toUpperCase() + '. data.message: ' + data.message);
											message.reply('An error occurred! Please try again later');
											break;
										case 3:
											console.log('Failed to find versions of this card on cardmarket. PrintTag: ' + args[0].toUpperCase() + '. data.message: ' + data.message);
											message.reply('Failed to find versions of this card on cardmarket!');
											break;
										case 4:
											console.log('Failed to find version on cardmarket. PrintTag: ' + args[0].toUpperCase() + '. data.message: ' + data.message);
											message.reply('Failed to find version on cardmarket!');
											break;
										case 5:
											console.log('Failed to find cardmarket price for ' + args[0].toUpperCase() + '. data.message: ' + data.message);
											message.reply('Failed to find cardmarket price!');
											break;

										default:
											console.log('Failed to find card ' + args[0].toUpperCase() + '. data.message: ' + data.message);
											message.reply('An error occurred! Please try again later');
											break;
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
			} else if(msg.startsWith('!help ') || msg == '!help') {
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