/**
 * ============================================================================
 * summary.js -- This builds the stock chart under id='summary_chart'
 * This handles the stock chart for the summary tab of the chart page.
 * ============================================================================
 */

function buildSummaryTable(sumdata) {
    var labels = [
        "Asset Type",
        "Name",
        "Exchange",
        "Sector",
        "Industry",
        "Market Cap",
        "P/E Ratio",
        "52-Week High",
        "52-Week Low",
        "Dividend Per Share",
        "Dividend Yield",
        "EPS"
    ];

    var accessors = [
        "AssetType",
        "Name",
        "Exchange",
        "Sector",
        "Industry",
        "MarketCapitalization",
        "PERatio",
        "52WeekHigh",
        "52WeekLow",
        "DividendPerShare",
        "DividendYield",
        "EPS"
    ];

    var sumtable = d3.select("#summary-table");
    sumtable.attr("class", "table table-striped align-middle text-color");
    for (var i = 0; i < accessors.length; i++) {
        var tr = sumtable.append("tr");
        tr.append("td")
            .attr("style", "text-align: left")
            .text(labels[i]);
        tr.append("td")
            .attr("style", "text-align: right")
            .text(formatStats(sumdata[accessors[i]]));
    }
}

/********************* CREATE AND INJECT THE CHART ***************************/
function buildSummaryChart(ticker, quotes) {
    // initialize data
    var date = new Array(),         // date
        close = new Array(),        // closing price
        low = new Array(),          // low prices (for finding ymin)
        high = new Array(),         // high prices (for finding ymax)
        linedata = new Array(),     // paired data for the line
        alldata = new Array();      // all the data for the tooltips

    for (i = 0; i < quotes.length; i++) {
        date.push(makeDate(quotes[i].Date));    // convert the date
        close.push(quotes[i].Close);        // grab the close
        low.push(quotes[i].Low);            // grab the low
        high.push(quotes[i].High);          // grab the high

        // mapping for the line data
        linedata.push({
            date: date[i],
            close: close[i]
        });

        // collect all data with the proper formatting
        alldata.push({
            date: date[i],
            open: quotes[i].Open,
            close: close[i],
            high: quotes[i].High,
            low: quotes[i].Low,
            volume: quotes[i].Volume      /* this might need scrapping later */
        })
    }

    /*************************** INITIALIZATIONS *********************************/
    // set the share price tag in the document page
    var share = linedata[linedata.length - 1].close
    document.getElementById('share_price').innerText = `$${parseFloat(share).toFixed(Math.max(2, (share.toString().split('.')[1] || []).length))}`;
    
    // enumerator for handling resizing
    const x = { month: 2, sixmonth: 3, ytd: 4, year: 5, fiveyear: 6, max: 7 };

    // initialize primary graph sizes
    const total_height = 360;
    const total_width = 480;
    const margin = { top: 15, right: 40, bottom: 30, left: 20 };
    const width = total_width - margin.left - margin.right;
    const height = total_height - margin.top - margin.bottom;

    // set up x & y domain
    const xdomain = d3.extent(date);
    const ydomain = [Math.min(...low), Math.min(...high)];

    // set up main x & y scales (these are functions)
    const xscale = d3.scaleTime().domain(xdomain).range([0, width]);
    const yscale = d3.scaleLinear().domain(ydomain).range([height, 0]).nice();
    const xscale2 = d3.scaleTime().domain(xdomain).range([0, width]);

    // add the svg to the page (this is an Object)
    const svg = d3.select('#summary-chart')
        .append('svg')
        .classed('svg-container', true)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${total_width} ${total_height}`)
        .append('g')
        .attr('id', 'chart-s');

    // create the axes
    const xaxis = d3.axisBottom(xscale),
        yaxis = d3.axisRight(yscale);

    // initialize the area lines
    const line = d3.area()          // line for the primary chart
        .x(function (d) { return xscale(d.date); })
        .y0(yscale(0))
        .y1(function (d) { return yscale(d.close); });

    // added to the chart under 'clip-path' attribute
    const clip = svg.append('defs').append('svg:clipPath')
        .attr('id', 'clip-s')
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0);

    // set up the gradient
    const gradient = svg.append('defs').append('linearGradient')
        .attr('id', 'chart-gradient-s')
        .attr('x1', '0%')       // these set up the direction of the gradient
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');    // desired: top to bottom

    // set the ending point
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(56, 56, 236, 0.3)')
        .attr('stop-opacity', 1);

    // set the start point
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(43, 93, 230, 0)')
        .attr('stop-opacity', 1);

    // chart body
    const chart = svg.append('g')
        .attr('class', 'focus-s')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('clip-path', 'url(#clip-s)');

    // actual chart
    const focus = svg.append('g')
        .attr('class', 'focus-s')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    /************************** ADD PATHS AND AXES *******************************/
    // add the x-axis to the big chart
    focus.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xaxis);

    // add the y-axis to the big chart
    focus.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${width}, 0)`)
        .call(yaxis);

    // add the line to the focus chart
    chart.append('path')              // append a path tag
        .datum(linedata)                // bind the data to the line
        .attr('class', 'data-line')   // class can be modified in css
        .attr('d', line)              // add the data line
        .style('fill', 'url(#chart-gradient-s)');  // add the gradient

    // call this to fix something broken
    rescalebybutton(x.max);

    /************************** END OF AXES AND PATHS ****************************/

    /************************ ZOOM BUTTON IMPLEMENTATION *************************/
    // create date function
    function subtractDays(date, days) {
        var date = new Date(date);
        date.setDate(date.getDate() - days);
        return date;
    }

    // add the listeners
    document.getElementById('1month_s').onclick = onemonth;
    document.getElementById('6month_s').onclick = sixmonth;
    document.getElementById('ytd_s').onclick = ytd;
    document.getElementById('year_s').onclick = year;
    document.getElementById('5year_s').onclick = fiveyear;
    document.getElementById('max_s').onclick = max;

    function onemonth() { rescalebybutton(x.month); }
    function sixmonth() { rescalebybutton(x.sixmonth); }
    function ytd() { rescalebybutton(x.ytd); }
    function year() { rescalebybutton(x.year); }
    function fiveyear() { rescalebybutton(x.fiveyear); }
    function max() { rescalebybutton(x.max); }

    // get the date closest to the provided range
    // for each, we must consider if the range causes the xmin to be before the IPO of the stock
    function getclosestdate(howfar) {
        var xmin = xscale2.domain()[0];            // default to original min
        var xmax = xscale2.domain()[1];            // max value of the set
        var year = xmax.getFullYear();              // XXXX not XX
        switch (howfar) {
            case 1:         // 1 week
                var start = subtractDays(xmax, 7);      // subtract 7 days
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            case 2:         // 1 month
                var start = subtractDays(xmax, 30);     // subtract a month
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            case 3:         // 6 month
                var start = subtractDays(xmax, 240);    // subtract 6 months
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            case 4:         // ytd
                var start = new Date(year, 0, 0);       // 1/1/YYYY
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            case 5:         // year
                var start = subtractDays(xmax, 365);    // subtract a year
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            case 6:
                var start = subtractDays(xmax, 5*365);    // subtract a year
                xmin = start > xscale2.domain()[0] ? start : xscale2.domain()[0];
                break;
            default:         // max, or any other unexpected value
                xmax = xscale2.domain()[1];
                xmin = xscale2.domain()[0];
                break;
        }
        xscale.domain([xmin, xmax]);
        return xmin;
    }

    function rescalebybutton(howfar) {
        // rescale the y axis
        var xmin = getclosestdate(howfar);
        var xmax = xscale.domain()[1];
        var someset = linedata.filter(function (d) { return d.date >= xmin && d.date <= xmax })
        var subset = [];
        someset.map(function (d) { subset.push(d.close); });

        // update the scale & axes
        yscale.domain([Math.min(...subset), Math.max(...subset)]).nice();

        // update the charts
        chart.select('.data-line').attr('d', line); // update the data
        focus.select('.x-axis').call(xaxis);       // update the x-axis
        focus.select('.y-axis').call(yaxis);       // update the y-axis
    }
    /********************** END OF ZOOM BUTTON IMPLEMENTATION **********************/

    /******************************** TOOLTIP FUNCTIONALITY *******************************/
    // add tooltip functionality
    const hoveroverlay = focus.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', updateSummaryTips);

    // add the line for the tooltip
    const hoverline = focus.append('g')
        .append('rect')
        .attr('class', 'dotted-s')
        .attr('height', height);

    // get the tooltip elements from the html
    const tooltip = d3.select('#tooltip-s')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    const tooltipcircle = focus.append('circle')
        .attr('class', 'tooltip-circle-s')
        .attr('r', 5)
        .style('opacity', 0);

    // on mousemove to make the tooltips
    function updateSummaryTips() {
        // get the data point closest to the mouse
        const hoverdate = xscale.invert(d3.mouse(this)[0]);
        const index = findClosest(hoverdate, date);
        const closest = alldata[index];

        // format the date
        const formatdate = d3.timeFormat('%B %d, %Y');   // how the date is formatted in the tooltip
        tooltip.select('#date-s').text(formatdate(closest.date) + "\t");

        // format the prices, all should have at least 2 decimal places
        const formatprice = (d) => `$${parseFloat(d).toFixed(Math.max(2, (d.toString().split('.')[1] || []).length))}`;
        tooltip.select('#price').html(formatprice(closest.open));

        // move the tooltips
        const x = xscale(closest.date) + margin.left;
        const y = yscale(closest.close) + margin.top;
        tooltip.style('opacity', 1);

        tooltipcircle.attr('cx', xscale(closest.date))
            .attr('cy', yscale(closest.close))
            .style('opacity', 1);

        hoverline.attr('x', xscale(closest.date));
    }
    /*********************** END OF TOOLTIP FUNCTIONALITY ************************/
}
