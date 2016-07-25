var config = require("./config/config.js");
var Discord = require("discord.js");
var fs = require("fs");
var Datastore = require("nedb");
var google = require("googleapis");
var request = require('request');
var youtube = google.youtube("v3");

var utilities = require("./johnbot-utilities.js");
var overwatchStats = require("./stats");
var quote = require("./quote");

var db = new Datastore({filename:"synctube.db"});
db.loadDatabase();

var mybot = new Discord.Client();

var text = null;
var voice = null;

var quiet = true;

var fileUploadOverload = false;

var insensitiveWords = [];
var admins = [];
var googleapikey = "";

//var regex = 'count\S,([a-z\s0-9,]*)';
var regex = '(count)';
var regex2 = /count',([a-z\s0-9,]*),/;

var containers = [];

var searchDatabases = [{tag:"boi", urlPrepend:"http://bindingofisaac.wikia.com/wiki/"},
					   {tag:"wikipedia", urlPrepend:"https://en.wikipedia.org/wiki/"}];

fs.readFile(".databases/insensitivelines.txt", 'ascii', function(err, data)
{
	var things = data;
	things = things.toLowerCase();
	things = things.split('\r\n');
	insensitiveWords = things;
});

fs.readFile("./config/admins", 'ascii', function(err, data)
{
	var adminfile = data;
	adminfile = adminfile.split(/\s+/);
	admins = adminfile;
});

fs.readFile("./config/googleapikey.txt", 'ascii', function(err, data)
{
	googleapikey = data;
});

console.log("The bot is now ready to be setup. Type !setup.");

function determineAdmin(user)
{
	for (var index = 0; index < admins.length; ++index)
	{
		if (user.id === admins[index]) return true;
	}
	return false;
}

mybot.on("message", function(message){

	var command = message.content.split(" ")[0];
	command = command.replace("!", "");
	console.log("Command: " + command);

	if(message.content === "!setup")
	{
		if (determineAdmin(message.author))
		{
			voice = message.author.voiceChannel;
			text = message.channel;
			mybot.joinVoiceChannel(voice);
			mybot.sendMessage(text, "Text Channel: " + text + ", Voice Channel: " + voice + "\n" 
				     + mybot.user + " is at your service.\n"+ "Type !help for a command list.",
					 {tts:false}, deleteMessage
					 );
		}
	}
	if(message.content === "!quiet")
	{
		if (determineAdmin(message.author))
		{
			quiet = !quiet;
			mybot.sendMessage(text, 
			(quiet ? "This bot won't play sounds." : "This bot will now play sounds."),
			{tts:false}, deleteMessage
			);
		}
		else
		{
			mybot.sendMessage(text, 
			"You don't have permissions to change if the bot is playing sounds or not. \n" + 
			(quiet ? "This bot is not playing sounds." : "This bot is playing sounds."),
			{tts:false}, deleteMessage
			);
		}
	}
	else if(message.content === "!help")
	{
		mybot.sendMessage(text,

		"**!boi [query]**: Get an article from Binding of Isaac wiki.\n" +  
		"**!chat_txt**: Give a random chat_txt quote.\n" +
		"**!comment [query]**: (alias !ytthumbnails) Pull a thumbnail and a comment from Youtube, given a query.\n" +
		"**!help**: Show this help dialog.\n"+
		"**!isit" + config.insensitiveCallout + " [possibly " + config.insensitiveCallout +
		" thing (optional)]**: Ask if something is " + config.insensitiveCallout + ".\n" +
		"**!motd**: Show John.\n" +
		"**!overwatch**: View Overwatch skill rating distribution.\n" +
		"**!overgame**: Give a random Overgame quote.\n" +
		"**!quiet**: **For admins**: Toggle if the bot is quiet. **Otherwise**: Check the bot's quiet status.\n" +
		"**!skillrating [rank]**: View the percentile range for a certain skill rating in Overwatch.\n" +
		"**!synctube**: \"Does anybody want to Synctube?\"\n" +
		"**!wikipedia [query]**: Get an article from Wikipedia.\n" + 
		"**be " + config.insensitiveCallout + "**: Get asked if a word you said was " + config.insensitiveCallout + ".\n" + 
		"**what happened/did you hear what happened/did you hear about [query]**: Ask a Minecraft joke writer what happened."
		,
		{tts:false}, deleteMessageSlower
		);
	}
	else if(message.content === "!motd")
	{
		johnDotJPG(message.author);
	}
	else if(message.content === "!overwatch")
	{
		/*
		var summation = overwatchStats.summate(containers);
		var mean = overwatchStats.mean(containers);
		var standardDeviation = overwatchStats.standardDeviation(containers);
		
		mybot.sendMessage(text,
		"Overwatch Competitive Skill Rating Statistics:\n" +
		"**Sample size:** " + summation + " players\n" +
		"**Mean:** Skill Rating of " + mean + "\n" +
		"**Standard Deviation:** " + standardDeviation + " skill rating points\n" +
		overwatchStats.standard1(containers)
		,
		{tts:false}, deleteMessageSlower
		);
		*/
		updateStats(overwatchSummary, message);
	}
	else if(message.content.startsWith("!skillrating"))
	{
		/*
		var searchable = message.content.replace("!skillrating ","");
		var parsed = parseInt(searchable);
		if (!isNaN(parsed))
		{
			mybot.sendMessage(text,
			overwatchStats.ratingPercentile(containers, parsed) + "\n" +
			"There are **" + overwatchStats.amount(containers, parsed) + "** players in this skill rating.\n" + 
			"Rankings between **" + overwatchStats.playersLowerRank(containers, parsed) +
			"** and **" + overwatchStats.playersUpperRank(containers, parsed) + "**."
			,
			{tts:false}, deleteMessageSlower
			);
		}
		*/
		updateStats(skillRating, message);
	}
	/*
    else if(message.content.startsWith("!ranking"))
	{
		var searchable = message.content.replace("!ranking ","");
		var parsed = parseInt(searchable);
		if (!isNaN(parsed))
		{
			mybot.sendMessage(text,
			overwatchStats.rankingPercentile(containers, parsed) + ",\n" +
			"corresponding to a Skill Rating of **" + overwatchStats.ratingFromRanking(containers, parsed) + "**"
			,
			{tts:false}, deleteMessageSlower
			);
		}
	}
	*/
	else if(message.content.startsWith("!idall"))
	{
		if (voice != null)
		{
			var str = "";
			for (var index = 0; index < voice.members.length; ++index)
			{
				str = str + voice.members[index].username + ": " + voice.members[index].id + "\n";
			}
			mybot.sendMessage(text, str, {}, deleteMessage);
		}
	}
	else if(message.content.startsWith("!id"))
	{
		var mentions = message.mentions;
		var numMentions = mentions.length;
		var str = "";
		for (var index = 0; index < numMentions; ++index)
		{
			str = str + mentions[index] + " " + mentions[index].id;
			if (index != numMentions - 1)
			{
				str = str + ", ";
			}
		}
		mybot.sendMessage(text, str, {}, deleteMessage);
		console.log(str);
	}
	else if(message.content.startsWith("!comment ") || message.content.startsWith("!ytthumbnails "))
	{
		var searchable = message.content.replace("!comment ","");
		youtube.search.list({part:"snippet",maxResults:10,q:searchable,auth:googleapikey}, function(err, data){
			var rand = Math.floor(Math.random() * data.items.length);
			//console.log(data.items[0].id);
			if (err || data.items.length == 0)  mybot.sendMessage(text, "Couldn\'t find anything for that query.");
			else if(data.items[rand].id.kind == "youtube#video")
			{
				mybot.sendMessage(text, "https://www.youtube.com/watch?v=" + data.items[rand].id.videoId);
				youtube.commentThreads.list({part:"snippet",maxResults:10,videoId:data.items[rand].id.videoId,auth:googleapikey}, function(err2, data2)
				{
					if (data2.items.length == 0)  mybot.sendMessage(text, "This video has no comments.");
					else if (err2) mybot.sendMessage(text, "Comments are disabled for the given video.");
					else
					{
						var rand2 = Math.floor(Math.random() * data2.items.length);
						mybot.sendMessage(text, "**" + data2.items[rand2].snippet.topLevelComment.snippet.authorDisplayName + "**" + "\n" + data2.items[rand2].snippet.topLevelComment.snippet.textDisplay);
					}
				});
			}
				
		});
	}
	else if(message.content.toLowerCase().startsWith("what happened") ||
			message.content.toLowerCase().startsWith("did you hear what happened") ||
			message.content.toLowerCase().startsWith("did you hear about"))
	{
		setTimeout(function(){ 
			mybot.startTyping(text);
		}, 2000);
		setTimeout(function(){
			var rand = Math.random();
			mybot.sendMessage(text, (Math.floor(Math.random() * 2) == 1 ? "They were destroyed!": "They went boom!"),{tts:false});
			mybot.stopTyping(text);
		}, 5000);
	}
	else if(message.content === "!isit" + config.insensitiveCallout)
	{
		callOutInsensitivity("it");
	}
	else if(message.content.startsWith("!isit" + config.insensitiveCallout + " " ))
	{
		callOutInsensitivity(message.content.substring(6 + config.insensitiveCallout.length, message.content.length));
	}
	else if(message.content === "!synctube")
	{
		var d = new Date();
		d.setHours(d.getHours() - 12);
		db.count({date: {$gt: d }}, function(err, count){
			mybot.sendMessage(text, count + " people have valid votes in.");
			db.count({will:true, date: {$gt: d }}, function(err, count){
				mybot.sendMessage(text, count + " wish to Synctube.");
				db.find({will:true, date: {$gt: d }}, function(err, docs){
					if (docs.length > 0)
					{
						var message = "The people who want to Synctube include\n";
						for (var index = 0; index < docs.length; ++index)
						{
							message = message + "<@" + docs[index].id + ">" + ", who voted on " + 
								      (docs[index].date.getUTCHours() - 5) + ":" + docs[index].date.getUTCMinutes() + " EST\n";
						}
						mybot.sendMessage(text, message);
					}	
					db.find({will:false, date: {$gt: d }}, function(err, docs){
						var message = "";
						if (docs.length > 0)
						{	
							message = message + "The people who don't want to Synctube include\n";
							for (var index = 0; index < docs.length; ++index)
							{
								message = message + "<@" + docs[index].id + ">" + ", who voted on " + 
										  (docs[index].date.getUTCHours() - 5) + ":" + docs[index].date.getUTCMinutes() + " EST\n";
							}
						}
						message = message + "Type \"will sync\" if you want to today,\nor \"wont sync\" if you're not feeling it today.";
						mybot.sendMessage(text, message);
					});
				});
			});
		});
	}
	else if(command.includes("overgame") || command.includes("chat_txt"))
	{
		console.log("got it");
		quote(command, function(err, data)
		{
			if (!err) mybot.sendMessage(text, data); //needs better error handling
		});
	}
	else if(message.content.startsWith("!"))
	{
		search(message);
	}
	else if(message.content.includes("will syn") && message.author != mybot.user)
	{
		db.find({id: message.author.id}, function (err, docs)
		{
			if (docs.length == 0)
			{
				db.insert({id:message.author.id,will:true,date:new Date()});
			}
			else if (docs.length == 1)
			{
				db.update({id:message.author.id},{ id: message.author.id, will:true, date: new Date()}, {}, function () {

				});
			}
		});
		mybot.sendMessage(text, message.author + " wishes to Synctube. Their vote will be valid for 12 hours.");
		mybot.sendMessage(text, "Type \"will sync\" if you want to today,\nor \"wont sync\" if you're not feeling it today.\nType !synctube if you want to see who wants to.");
	}
	else if((message.content.includes("wont syn") || message.content.includes("won't syn")) && message.author != mybot.user)
	{
		db.find({id: message.author.id}, function (err, docs)
		{
			if (docs.length == 0)
			{
				db.insert({id:message.author.id,will:false,date:new Date()});
			}
			else if (docs.length == 1)
			{
				db.update({id:message.author.id},{ id: message.author.id, will:false, date: new Date()}, {}, function () {

				});
			}
		});
		mybot.sendMessage(text, message.author + " does not wish to Synctube. Their disdain will be noted for 12 hours.");
		mybot.sendMessage(text, "Type \"will sync\" if you want to today,\nor \"wont sync\" if you're not feeling it today.\nType !synctube if you want to see who wants to.");
	}
	else if(message.author != mybot.user)
	{
		var length = insensitiveWords.length;
		var messageBytes = message.content.toLowerCase();
		messageBytes = messageBytes.split(/\s+/);
		var length2 = messageBytes.length;
		//regularize input
		for (var bytes = 0; bytes < length2; ++bytes)
		{
			messageBytes[bytes] = messageBytes[bytes].replace(/\./g, "");
			messageBytes[bytes] = messageBytes[bytes].replace(/!/g, "");
			messageBytes[bytes] = messageBytes[bytes].replace(/\?/g, "");
		}
		for (var index = 0; index < length; ++index)
		{
			var insensitiveWord = insensitiveWords[index];
			for (var index2 = 0; index2 < length2; ++index2)
			{
				if(insensitiveWord === messageBytes[index2])
				{
					callOutInsensitivity("\"" + insensitiveWords[index] + "\"");
					return;
				}
			}
		}
	}
});

var deleteMessage = function(error, message)
{
	if(!error) mybot.deleteMessage(message,{wait:9000});
}

var deleteMessageSlower = function(error, message)
{
	if(!error) mybot.deleteMessage(message,{wait:60000});
}

var deleteFile = function(error, message)
{
	if(!error) 
	mybot.deleteMessage(message,{wait:9000}, function(error)
	{
		fileUploadOverload = false;
	});
}

function callOutInsensitivity(insensitiveString)
{

	mybot.sendMessage(text, "Is " + insensitiveString + " " + config.insensitiveCallout + "?", {tts:false}, deleteMessage);
	if (!quiet)
	{
		if(!fileUploadOverload)
		{
			fileUploadOverload = true;
			mybot.sendFile(text, "insensitive.gif", null, deleteFile);
		}
		mybot.voiceConnection.playFile("insensitive.mp4", {volume:.25});
	}
}

function search(message)
{
	for(var index = 0; index < searchDatabases.length; ++index)
	{
		if(message.content.length >= searchDatabases[index].tag.length + 2 && 
		   message.content.substring(1, 1 + searchDatabases[index].tag.length) === searchDatabases[index].tag)
		{
			var searchable = message.content.substring(2 + searchDatabases[index].tag.length, message.content.length);
			searchable = searchable.replace(/ /g, "_");
			mybot.sendMessage(text, searchDatabases[index].urlPrepend + searchable);
			return true;
		}
	}
	return false;
}

function johnDotJPG(user)
{
	mybot.sendFile(text, "john.jpg", null, deleteMessage);
	mybot.sendMessage(text, "Welcome to The Mumbcord" + 
	", " + user.name + ". Don't leave the Discord or John Will Get You",
	{tts:false}, deleteMessage);
	//mybot.sendMessage(text, "By the way, we're asking users if they want to Synctube.\nType \"will sync\" if you want to today,\nor \"wont sync\" if you're not feeling it today.\nType !synctube if you want to see who wants to.");
}

mybot.on("voiceJoin", function(voiceChannel, user){
	if (voiceChannel.equals(voice) && user != mybot.user)
	{	
		johnDotJPG(user);
	}
	if (mybot.voiceConnection != null && !quiet) 
	{
		if 		(user.id == "166809145914294272")	mybot.voiceConnection.playFile("./users/wayne.mp3", {volume:.5});

		else if (user.id == "130775341961707520")	mybot.voiceConnection.playFile("./users/burit.mp3", {volume:.25});
		else if (user.id == "135896114506366976")	mybot.voiceConnection.playFile("./users/gir.wav", {volume:.5});
		else if (user.id == "156508417492647936")	mybot.voiceConnection.playFile("./users/kami.wav", {volume:.5});
		else if (user.id == "145618627977019392")	mybot.voiceConnection.playFile("./users/baaulp.wav", {volume:.5});
		else if (user.id == "109025530564599808")	mybot.voiceConnection.playFile("./users/ogw.wav", {volume:.5});
		else 										mybot.voiceConnection.playFile(null , {volume:.5});
	}
});

mybot.on("voiceLeave", function(voiceChannel, user){
	if (voiceChannel.equals(voice))
	{
		mybot.sendMessage(text, user.name + " has left " + voice + ".", {tts:false});
	}
});


mybot.login(config.login, config.password);

var overwatchSummary = function (error, data, message)
{
	var summation = overwatchStats.summate(data);
	var mean = overwatchStats.mean(data);
	var standardDeviation = overwatchStats.standardDeviation(data);
	
	mybot.sendMessage(text,
	"Overwatch Competitive Skill Rating Statistics:\n" +
	"**Sample size:** " + summation + " players\n" +
	"**Mean:** Skill Rating of " + mean + "\n" +
	"**Standard Deviation:** " + standardDeviation + " skill rating points\n" +
	overwatchStats.standard1(data)
	,
	{tts:false}, deleteMessageSlower
	);
}

var skillRating = function (error, data, message)
{
	var searchable = message.content.replace("!skillrating ","");
	var parsed = parseInt(searchable);
	if (!isNaN(parsed) && parsed >= 1 && parsed <= 100 )
	{
		var amt = overwatchStats.amount(data, parsed);
	
		mybot.sendMessage(text,
		overwatchStats.ratingPercentile(data, parsed) + "\n" +
		"There " + (amt != 1 ? "are" : "is") + " **" + overwatchStats.amount(data, parsed) + "** player" + (amt != 1 ? "s" : "") + " in this skill rating.\n" + 
		(amt > 0 ? "Rankings between **" + overwatchStats.playersLowerRank(data, parsed) +
		"** and **" + overwatchStats.playersUpperRank(data, parsed) + "**."
		:
		""
		)
		,
		{tts:false}, deleteMessageSlower
		);
	}
	else
	{
		mybot.sendMessage(text,
		"Please enter a valid skill rating between 1 and 100."
		,
		{tts:false}, deleteMessageSlower
		);
	}
	
}

var updateStats = function(callback, message)
{
	request('http://masteroverwatch.com/leaderboards/pc/us/mode/ranked/category/mmr',
	function (error, response, body) 
	{
		if (!error && response.statusCode == 200) 
		{
			var patt = new RegExp(regex2);

			var match = regex2.exec(body);

			var json = "[" + match[1] + "]";
			json = json.replace(/\s/g, "");

			containers = JSON.parse(json);
		}
		callback(error, containers, message);
	});
}

