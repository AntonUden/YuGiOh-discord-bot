const request = require('request');
const Discord = require('discord.js');
const config  = require('./config.json');
const client  = new Discord.Client();

client.on('ready', () => {
	console.log('Discord client ready!');
});

client.on('message', message => {
	if (message.author.bot) {
		return;
	}

	if(config.channels.includes(message.channel.id)) {
		let msg = message.content.toLowerCase();
		let args = msg.split(" ");
		args.splice(0, 1);
		if(msg.startsWith('!info')) {
			if(args.length == 1) {
				console.log('Checking info for ' + args[0]);
				request(config.api_url + '/cardinfo/' + args[0], function (error, response, body) {
					if(error) {
						console.log('Failed to check info for ' + args[0] + ' API Error');
						console.warn(error);
						message.reply('An error occurred! Please try again later');
						return;
					}

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
				});
			} else {
				message.reply('Useage: !info <PrintTag>');
			}
		} else if(msg.startsWith('!price')) {
			if(args.length == 1) {
				console.log('Checking price for ' + args[0]);
				request(config.api_url + '/cardprice/' + args[0], function (error, response, body) {
					if(error) {
						console.log('Failed to check price for ' + args[0] + ' API Error');
						console.warn(error);
						message.reply('An error occurred! Please try again later');
						return;
					}

					let data = JSON.parse(body);
					
					if(data.success) {
						console.log('Success');
						if(data.data.cardmarket.lowest_price != undefined)  {
							let result = '\nCard type: ' + data.data.card.card_type;
							result += '\nName: ' + data.data.card.name;
							result += '\nSet: ' + data.data.card.price_data.name;
							result += '\nRarity: ' + data.data.card.price_data.rarity;
							result += '\nCardmarket price: ' + data.data.cardmarket.lowest_price + ' €';

							message.reply(result);
						}
					} else {
						if(data.error) {
							console.log('Failed to find card ' + args[0].toUpperCase() + '. data.message: ' + data.message);
							message.reply('An error occurred! Please try again later');
						} else {
							console.log('Card with print tag ' + args[0].toUpperCase() + ' not found. data.message: ' + data.message);
							message.reply('Could not find card with print tag \'' + args[0].toUpperCase() + '\'');
						}
					}
				});
			} else {
				message.reply("Useage: !price <PrintTag>");
			}
		} else if(msg.startsWith('!help')) {
			message.reply('\n!help\n!info <PrintTag>\n!price <PrintTag>');
		} else {
			message.reply('Unknown command. Use !help for a list of commands');
		}
	}
});

client.login(config.discord_token);