/**
 * ============================================================================
 * statistics.js -- This populates the statistics table on the chart page
 * ============================================================================
 */

// formats a string for the statistics
function formatStats(str) {
	var alpha = /^[\s+a-zA-Z,&:]+$/;
	var snip = "[0-9]+";
	var numreg = new RegExp("^("+ snip + ")$");

	// format large numbers
	if (str.match(numreg)) {
		// parse it and check for big num
		var num = parseInt(str, 10);
		if (num >= 1E12) {	// use trillions
			text = (num/1E12).toFixed(2) + 'T';
		} else if (num >= 1E9) {	// use billions
			text = (num/1E9).toFixed(2) + 'B';
		} else if (num >= 1E6) {	// use millions
			text = (num/1E6).toFixed(2) + 'M';
		} else {
			text = num
		}
	} 
	// format strings (only capitalize each word)
	else if (str.match(alpha) && str.length >= 4) {
		if (str == 'None') {
			text = "N/A";
		} else {
			foo = str.toLowerCase();
			text = foo.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
		}
	} 
	// no formatting
	else {
		text = str
	}
	return text
}

function buildStatistics(fund) {
	// initialize dataset
	var stats = fund;
	document.getElementById("company-description").innerText = fund.Description;

	// metadata
	var metaheaders = [
		"Asset Type",
		"Name",
		"Exchange",
		"Currency",
		"Country",
		"Sector",
		"Industry",
		"Address",
		"Fiscal Year End",
		"Latest Quarter",
	];

	var metaindexes = [
		"AssetType",
		"Name",
		"Exchange",
		"Currency",
		"Country",
		"Sector",
		"Industry",
		"Address",
		"FiscalYearEnd",
		"LatestQuarter",
	]

	// valuation
	var valueheaders = [
		"Book Value",
		"Trailing PE",
		"Forward PE",
		"Price To Sales Ratio (ttm)",
		"Price To Book Ratio",
		"EV To Revenue",
		"EV To EBITDA",
	];

	var valueindexes = [
		"BookValue",
		"TrailingPE",
		"ForwardPE",
		"PriceToSalesRatioTTM",
		"PriceToBookRatio",
		"EVToRevenue",
		"EVToEBITDA",
	];

	// income
	var incomeheaders = [
		"Revenue (ttm)",
		"Revenue Per Share (ttm)",
		"Quarterly Revenue Growth (yoy)",
		"Gross Profit (ttm)",
		"EBITDA",
		"Profit Margin",
		"Operating Margin (ttm)",
		"Return On Assets (ttm)",
		"Return On Equity (ttm)",
		"EPS",
		"Diluted EPS (ttm)",
		"Quarterly Earnings Growth (yoy)",
	];
	
	var incomeindexes = [
		"RevenueTTM",
		"RevenuePerShareTTM",
		"QuarterlyRevenueGrowthYOY",
		"GrossProfitTTM",
		"EBITDA",
		"ProfitMargin",
		"OperatingMarginTTM",
		"ReturnOnAssetsTTM",
		"ReturnOnEquityTTM",
		"EPS",
		"DilutedEPSTTM",
		"QuarterlyEarningsGrowthYOY",
	];

	// dividends
	var dividendheaders = [
		"Dividend Per Share",
		"Dividend Yield",
		"Forward Annual Dividend Rate",
		"Forward Annual Dividend Yield",
		"Payout Ratio",
		"Dividend Date",
		"Ex Dividend Date",
		"Last Split Factor",
		"Last Split Date",
	];

	var dividendindexes = [
		"DividendPerShare",
		"DividendYield",
		"ForwardAnnualDividendRate",
		"ForwardAnnualDividendYield",
		"PayoutRatio",
		"DividendDate",
		"ExDividendDate",
		"LastSplitFactor",
		"LastSplitDate",
	];

	// essentials
	var tradeheaders = [
		"Market Cap",
		"P/E Ratio",
		"PEG Ratio",
		"Analyst Target Price",
		"Beta",
		"52-Week High",
		"52-Week Low",
	];

	var tradeindexes = [
		"MarketCapitalization",
		"PERatio",
		"PEGRatio",
		"AnalystTargetPrice",
		"Beta",
		"52WeekHigh",
		"52WeekLow",
	];

	// share info
	var shareheaders = [
		"Shares Outstanding",
		"Shares Float",
		"Shares Short",
		"Shares Short Prior Month",
		"Short Ratio",
		"Short % Outstanding",
		"Short % Float",
		"% Insiders",
		"% Institutions",
	];

	var shareindexes = [
		"SharesOutstanding",
		"SharesFloat",
		"SharesShort",
		"SharesShortPriorMonth",
		"ShortRatio",
		"ShortPercentOutstanding",
		"ShortPercentFloat",
		"PercentInsiders",
		"PercentInstitutions",
	];

	function buildTable(table, headers, indexes) {
		for (var i = 0; i < indexes.length; i++) {
			var tr = table.append("tr");
			tr.append("td")
				.attr("style", "text-align: left")
				//.attr("style", "font-weight: bold")
				.text(headers[i]);
			tr.append("td")
				.attr("style", "text-align: right")
				.text(formatStats(stats[indexes[i]]))
		}
	}

	// stats divided into 2 columns. financials & trading
	// grab the financial tables
	const metatable = d3.select("#meta")
	const valuetable = d3.select("#valuation")
	const incometable = d3.select("#income")
	
	// order: meta, value, income
	buildTable(metatable, metaheaders, metaindexes);
	buildTable(valuetable, valueheaders, valueindexes);
	buildTable(incometable, incomeheaders, incomeindexes);
	
	// grab the trading tables
	const tradetable = d3.select("#trading")
	const sharetable = d3.select("#share")
	const dividendtable = d3.select("#dividend")

	// order: trading, share, dividend
	buildTable(tradetable, tradeheaders, tradeindexes);
	buildTable(sharetable, shareheaders, shareindexes);
	buildTable(dividendtable, dividendheaders, dividendindexes);
}