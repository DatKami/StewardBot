/*
var regex = '\'count\',([a-z\s0-9,]*)';

var containers = 
[
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
1,
0,
0,
1,
0,
1,
1,
1,
3,
1,
3,
6,
7,
16,
22,
47,
65,
95,
154,
215,
289,
399,
536,
771,
943,
1172,
1450,
1678,
2028,
2288,
2589,
2671,
2732,
3037,
2847,
2867,
2746,
2472,
2193,
1909,
1608,
1383,
1082,
981,
673,
512,
413,
284,
199,
147,
108,
79,
61,
56,
30,
36,
16,
13,
9,
7,
0,
2,
0,
1,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
];
*/

var summate = function(arr, lower, upper)
{
	if (lower == null) lower = 1;
	if (upper == null) upper = arr.length;
	//bound checking
	lower = (lower > 1 ? lower : 1);
	upper = (upper < arr.length ? upper : arr.length);
	var summ = 0;
	for (var index = lower; index <= upper; ++index)
	{
		summ += arr[index-1];
	}
	return summ;
}

var mean = function(arr)
{
	var summscore = 0;
	for (var index = 0; index < arr.length; ++index)
	{
		summscore += (index + 1) * arr[index];
	}
	return centRound(summscore / summate(arr));
}

function decimalRound(num, places)
{
	return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

function centRound(num)
{
	return decimalRound(num, 2);
}

var ratingPercentile = function(arr, lowerRank, upperRank)
{
	if (!upperRank) upperRank = lowerRank;
	//normalize input
	lowerRank = (lowerRank < 100 ? lowerRank : 100);
	lowerRank = (lowerRank > 1 ? lowerRank : 1);
	upperRank = (upperRank < 100 ? upperRank : 100);
	upperRank = (upperRank > 1 ? upperRank : 1);
	console.log(lowerRank);
	console.log(upperRank);
	
	return "Skill Rating **" + (lowerRank == upperRank ? lowerRank : lowerRank + "-" + upperRank) + "**: **" +
	ratingLowerBound(arr, lowerRank) + "%** - **" + ratingUpperBound(arr, upperRank) + "%** percentile of sampled Overwatch players";
}

var rankingPercentile = function(arr, rank)
{
	var total = summate(arr);
	return "Rank **" + rank + "**: **" + centRound((total-rank)/total*100) + "%** percentile of sampled Overwatch players";
}

var ratingFromRanking = function(arr, rank)
{
	var summscore = 0;
	for (var index = arr.length; index >= 1; --index)
	{
		summscore += arr[index-1];
		if (summscore >= rank) return index;
	}
	return null; //error
}

var ratingLowerBound = function(arr, rank)
{
	//normalize input
	rank = (rank < 100 ? rank : 100);
	rank = (rank > 1 ? rank : 1);
	var lower = summate(arr, 1, rank-1);
	var total = summate(arr);

	return centRound(lower/total*100);
}

var ratingUpperBound = function(arr, rank)
{
	//normalize input
	rank = (rank < 100 ? rank : 100);
	rank = (rank > 1 ? rank : 1);
	var higher = summate(arr, rank + 1);
	var total = summate(arr);
	
	return centRound((total-higher)/total*100);
	
}

var playersLowerRank = function(arr, rank)
{
	//normalize input
	rank = (rank < 100 ? rank : 100);
	rank = (rank > 1 ? rank : 1);
	var lower = summate(arr, 1, rank-1);
	var total = summate(arr);
	
	return total-lower;
}

var playersUpperRank = function(arr, rank)
{
	//normalize input
	rank = (rank < 100 ? rank : 100);
	rank = (rank > 1 ? rank : 1);
	var higher = summate(arr, rank + 1);
	
	return higher+1;	
}

var amount = function(arr, rank)
{
	return arr[rank-1];
}

var standardDeviation = function(arr)
{
	var meansum = mean(arr);
	var variance = 0;
	for (var index = 0; index < arr.length; ++index)
	{
		variance += Math.pow(((index + 1)-meansum),2) * arr[index];
	}
	return centRound(Math.sqrt(variance / (summate(arr)-1)));
}

var standard1 = function(arr)
{
	var standardDev = standardDeviation(arr);
	var meansum = mean(arr);
	var lowerBound = Math.round(meansum - standardDev);
	var upperBound = Math.round(meansum + standardDev);
	
	var cent50 = ratingLowerBound(arr, 50);
	var cent51 = ratingUpperBound(arr, 51);
	
	var lowerCent = ratingLowerBound(arr, lowerBound);
	var upperCent = ratingLowerBound(arr, upperBound);
	
	return centRound(cent51 - cent50) + "% of players have a skill rating between 50 and 51.\n" +
	       centRound(upperCent - lowerCent) + "% of players have a skill rating between " + lowerBound + " and " + upperBound + ".\n";
		   
}

//exports.containers = containers;
exports.summate = summate;
exports.mean = mean;
exports.amount = amount;
exports.ratingLowerBound = ratingLowerBound;
exports.ratingUpperBound = ratingUpperBound;
exports.playersLowerRank = playersLowerRank;
exports.playersUpperRank = playersUpperRank;
exports.ratingPercentile = ratingPercentile;
exports.rankingPercentile = rankingPercentile;
exports.ratingFromRanking = ratingFromRanking;
exports.standardDeviation = standardDeviation;
exports.standard1 = standard1;


//console.log("Players: " + summate(containers));
//console.log("Mean Ranking: " + mean(containers));
//console.log("Standard Deviation: " + standardDeviation(containers));