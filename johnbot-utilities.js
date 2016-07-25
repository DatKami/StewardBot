var getBetweenQuotes = function(str)
{
	var output = "";
	var index = 0;
	var running = true;
	while (running)
	{
		if (str[index] == '\"' || str[index] == '\'')
		{
			++index;
			while(running)
			{	
				if (str[index] != '\"' && str[index] != '\'')
				{
					output = output + str[index];
					++index;
				}
				else { running = false; }
			}
		}
		++index;
	}
	return output;
}

exports.getBetweenQuotes = getBetweenQuotes;