/**
 * ============================================================================
 * explore.js -- This builds the top picks and top movers tables
 * Important! The data must be stored in an array under a <script> tag passed 
 *      in thru go gin
 * ============================================================================
 */

headers = ["Symbol","Price","Market Cap","% Change","EOD",
    "Technical","Fundamental","Pick Index","Rating"];

// "main" method
function exploremaster() {
    master();

    picks = new Array();
    for (var i = 0; i < 25; i++) {
        picks.push({
            symbol: 's',
            price: '4',
            market: '2123412341',
            pchange: "69.54",
            eod: "34",
            technical: "24",
            fundamental: "15",
            index: "9",
            rating: "strong buy"
        })
    }
    gainers = picks;

    populatePicks(picks)    // populate picks table
    populateMovers(gainers)  // populate gainers table
}

function populatePicks(picks) {
    // populate header row
    var pickstable = d3.select("#picks-table")
    var thead = pickstable.append("thead")
    var tr = thead.append("tr")
    for (var i = 0; i < headers.length; i++) {
        tr.append("th").text(headers[i])
    }
    
    // populate the picks table
    var tbody = pickstable.append("tbody")
    for (var i = 0; i < picks.length; i++) {
        var tr = tbody.append("tr");
        tr.append("td").text(picks[i].symbol)
        tr.append("td").text(picks[i].price)
        tr.append("td").text(picks[i].market)
        tr.append("td").text(picks[i].pchange)
        tr.append("td").text(picks[i].eod)
        tr.append("td").text(picks[i].technical)
        tr.append("td").text(picks[i].fundamental)
        tr.append("td").text(picks[i].index)
        tr.append("td").text(picks[i].rating)
    }
}

function populateMovers(gainers) {
    // populate header row
    var gainerstable = d3.select("#gainers-table")
    var thead = gainerstable.append("thead")
    var tr = thead.append("tr")
    for (var i = 0; i < headers.length; i++) {
        tr.append("th").text(headers[i])
    }
    
    // populate the gainers table
    var tbody = gainerstable.append("tbody")
    for (var i = 0; i < gainers.length; i++) {
        var tr = tbody.append("tr");
        tr.append("td").text(gainers[i].symbol)
        tr.append("td").text(gainers[i].price)
        tr.append("td").text(gainers[i].market)
        tr.append("td").text(gainers[i].pchange)
        tr.append("td").text(gainers[i].eod)
        tr.append("td").text(gainers[i].technical)
        tr.append("td").text(gainers[i].fundamental)
        tr.append("td").text(gainers[i].index)
        tr.append("td").text(gainers[i].rating)
    }
}