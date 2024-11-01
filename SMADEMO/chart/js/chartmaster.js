/**
 * ============================================================================
 * chartmaster.js -- Acts as the "main" for the chart page. Builds the elements
 *                   on page load.
 * ============================================================================
**/

function chartmaster() { 
    // do before everything else
    linkme();
    navByEnter();

    // grab the data that all the functions need
    var ticker = datas.Ticker;
    var quotes = datas.dat;
    var fundamental = fund
    var maths = tech;
    console.log(maths);

    // call the functions
    buildSummaryChart(ticker, quotes);
    buildSummaryTable(fundamental);
    RSI(maths.Dates, maths.RSI);
    MACD(maths.Dates, maths.MACD, maths.MACDsignal);
    buildStockChart(ticker, quotes, maths);
    buildStatistics(fundamental)
    buildHistoricalTab(quotes);
}