var fs = require("fs");

var quoteDatabases = [{tag:"overgame", quotes:[]},
					  {tag:"chat_txt", quotes:[]}];

fs.readFile(".databases/overgame.txt", 'ascii', function(err, data)
{
	var things = data;
	things = things.split('\r\n');
	quoteDatabases[0].quotes = things; //needs a more robust call
});

fs.readFile(".databases/chat_lines.csv", 'ucs2', function(err, data)
{
	var things = data;
	things = things.split('\r\n');
	quoteDatabases[1].quotes = things; //needs a more robust call
});


module.exports = function(tag, callback)
{
	console.log("heard you");
	console.log(tag);
	for(var index = 0; index < quoteDatabases.length; ++index)
	{
		if(tag === quoteDatabases[index].tag)
		{
			var quoteIndex = Math.floor(Math.random() * quoteDatabases[index].quotes.length);
			console.log(quoteDatabases[index].quotes[quoteIndex]);
			return callback(null, quoteDatabases[index].quotes[quoteIndex]);
		}
	}
	return callback(1); //i dunno how callback errors work yet but at least that evals true
}