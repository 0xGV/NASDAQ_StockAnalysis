/**
 * ============================================================================
 * stockchart.js -- This builds the stock chart under id='stock_chart'
 * Important! The data must be stored in an array under a <script> tag passed 
 *      in thru go gin
 * ============================================================================
 */

function buildHistoricalTab(historical) {
    // helper functions
    const dateformat = d3.timeFormat('%B %d, %Y');   // how the date is formatted in the tooltip
    const priceformat = (d) => `$${parseFloat(d).toFixed(Math.max(2))}`;

    // initialize data
    var histyboy = new Array();      // all the data for the tooltips

    for (i = 0; i < historical.length; i++) {
        // collect all data with the proper formatting
        histyboy.push({
            date: makeDate(historical[i].Date),
            open: historical[i].Open,
            high: historical[i].High,
            low: historical[i].Low,
            close : historical[i].Close,
            volume: historical[i].Volume      /* this might need scrapping later */
        })
    }

    // figure out how many years there are
    const years = new Set();
    for (var i = 0; i < histyboy.length; i++) {
        var year = histyboy[i].date.getFullYear();
        years.add(year);
    }

    // add the tab headers (i.e. the years)
    var yeararr = Array.from(years);
    const list = d3.select("#historicalheaders");
    for (var i = 0; i < yeararr.length; i++) {
        list.append("li")
            .attr("class", "nav-item")
            .attr("role", "presentation")
            .append("button")
            .attr("class", "nav-link")
            .attr("id", "year" + i + "-header")
            .attr("data-bs-toggle", "tab")
            .attr("data-bs-target", "#year" + i + "-tab")
            .attr("type", "button")
            .attr("role", "tab")
            .attr("aria-selected", "false")
            .text(yeararr[i]);
    }

    // preprocess: separate data by year
    var yeardata = new Array();
    var startidx = 0;
    for (let item of years.values()) {
        var yeari = new Array();
        for (var j = startidx; j < histyboy.length; j++) {
            var year = histyboy[j].date.getFullYear();

            // if the year is years[i], append to array
            if (item == year) {
                yeari.push(histyboy[j]);
            } else {
                startidx = j;   // set new starting point
                break;          // there won't be any more years equal to year[i]
            }
        }
        yeardata.push(yeari);
    }

    // each year is separated by a tab.
    const parent = d3.select("#historicaltabs");
    for (var i = 0; i < yeardata.length; i++) {
        // year tab
        const tab = parent.append("div")
            .attr("class", "tab-pane fade text-center")
            .attr("id", "year" + i + "-tab")
        
        // year table
        var table = d3.select("#year" + i + "-tab")
            .append("table")
            .attr("class", "table text-color")
            .attr("id", "year" + i + "-table");
        
        // append headers to the table
        var thead = table.append("thead")
        thead.append("td")
            .text("Date")
            .attr("style", "font-weight: bold");
        thead.append("td")
            .text("Open")
            .attr("style", "font-weight: bold");
        thead.append("td")
            .text("High")
            .attr("style", "font-weight: bold");
        thead.append("td")
            .text("Low")
            .attr("style", "font-weight: bold");
        thead.append("td")
            .text("Close")
            .attr("style", "font-weight: bold");

        // populate the table
        // data is arranged as follows:
        //      date, open, high, low, close
        var data = yeardata[i];
        for (var j = data.length - 1; j >= 0; j--) {
            // create the elements
            var tr = table.append("tr");
            tr.append("td").text(dateformat(data[j].date));
            tr.append("td").text(priceformat(data[j].open));
            tr.append("td").text(priceformat(data[j].high));
            tr.append("td").text(priceformat(data[j].low));
            tr.append("td").text(priceformat(data[j].close));
        }
    }

    // make most recent one active
    var idx = yeararr.length - 1;
    d3.select("#year" + idx + "-header")
        .attr("class", "nav-link active")
        .attr("aria-selected", "true");
    d3.select("#year" + idx + "-tab")
        .attr("class", "tab-pane fade text-center active show");
}