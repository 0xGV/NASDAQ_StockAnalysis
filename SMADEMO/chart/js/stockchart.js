/**
 * ============================================================================
 * stockchart.js -- This builds the stock chart under id='stock_chart'
 * Important! The data must be stored in an array under a <script> tag passed 
 *      in thru go gin
 * ============================================================================
 */

/********************** USEFUL FUNCTIONS BECAUSE JS SUCKS ********************/
// parse the date manually bc JS's Date class SUCKS
// date must be in the form of %d-%m-%Y (days and months must keep the leading 0)
function makeDate(date) {
    var day = +date.slice(0, 2);     // get the day
    var month = date.slice(3, 6);    // get the month
    var year = +date.slice(7, 12);   // get the year
    var monthindex = +0;

    if (month === "Jan") {
        monthindex = 0;
    } else if (month === "Feb") {
        monthindex = 1;
    } else if (month === "Mar") {
        monthindex = 2;
    } else if (month === "Apr") {
        monthindex = 3;
    } else if (month === "May") {
        monthindex = 4;
    } else if (month === "Jun") {
        monthindex = 5;
    } else if (month === "Jul") {
        monthindex = 6;
    } else if (month === "Aug") {
        monthindex = 7;
    } else if (month === "Sep") {
        monthindex = 8;
    } else if (month === "Oct") {
        monthindex = 9;
    } else if (month === "Nov") {
        monthindex = 10;
    } else if (month === "Dec") {
        monthindex = 11;
    } else {
        throw new Error("you suck");
    }
    return new Date(year, monthindex, day);
}

// custom get closest value to given value because JS SUCKS
// this function returns the index of the closest value to the given target value
function findClosest(target, arr) {
    // make a function that will be used here
    const getClosest = (val1, val2, target) => {
        if (target - val1 >= val2 - target)
            return val2;
        else
            return val1;
    }

    // the dates are sorted, so binary search is ez
    var n = arr.length,     // length saved for ease
        i = 0,              // left point
        j = n,              // right point
        mid = 0;            // middle point

    while (i < j) {
        mid = Math.trunc((i + j) / 2);

        if (arr[mid] == target)     // ez, exact value is found
            return mid;

        if (target < arr[mid]) {    // less than, move to the right
            if (mid > 0 && target > arr[mid - 1]) {
                return getClosest(arr[mid - 1], arr[mid], target) == arr[mid - 1] ? mid - 1 : mid;
            }
            j = mid;        // update j
        } else {                    // greater than, move to the right
            if (mid < n - 1 && target < arr[mid + 1]) {
                return getClosest(arr[mid], arr[mid + 1], target) == arr[mid] ? mid : mid + 1;
            }
            i = mid + 1;    // update i
        }
    }

    return mid;
}

// create date function
function subtractDays(date, days) {
    var date = new Date(date);
    date.setDate(date.getDate() - days);
    return date;
}

/********************* CREATE AND INJECT THE CHART ***************************/
function buildStockChart(ticker, quotes, maths) {
    /*************************** INITIALIZATIONS *********************************/
    // parse the data
    var date = new Array(),         // date
        close = new Array(),        // closing price
        low = new Array(),          // low prices (for finding ymin)
        high = new Array(),         // high prices (for finding ymax)
        linedata = new Array(),     // paired data for the line
        boll = new Array(),         // bollinger band prices
        sma = new Array(),          // simple moving average
        ema = new Array(),          // exponential moving average
        alldata = new Array();      // all the data for the tooltips

    for (i = 0; i < quotes.length; i++) {
        date.push(makeDate(quotes[i].Date));    // convert the date
        close.push(quotes[i].Close);        // grab the close
        low.push(quotes[i].Low);            // grab the low
        high.push(quotes[i].High);          // grab the high

        // mapping for the line data
        linedata.push({ date: date[i], close: close[i] });

        // collect all data with the proper formatting
        alldata.push({ date: date[i], open: quotes[i].Open, close: close[i],
            high: quotes[i].High, low: quotes[i].Low });
    }

    // get overlay data (this has various lengths cuz of how they're calculated
    // bollinger
    var offset = maths.Dates.length - maths.HighBand.length;
    for (var i = 0; i < maths.HighBand.length; i++) {
        boll.push({ date: date[i+offset], high: maths.HighBand[i],
            mid: maths.MidBand[i], low: maths.LowBand[i] });
    }

    // ema
    for (var i = 0; i < maths.EMA.length; i++) {
        ema.push({ date: date[i], ema: maths.EMA[i] });
    }

    // enumerator for handling resizing
    const x = { month: 2, sixmonth: 3, ytd: 4, year: 5, fiveyear: 6, max: 7 };

    // initialize subchart sizes
    const margin2 = { top: 20, right: 20, bottom: 20, left: 40 };
    const height2 = 40;

    // initialize primary graph sizes
    const total_width = 1080;
    const total_height = 680;
    const margin = { top: height2 + margin2.bottom + 30, right: 40, bottom: 30, left: 20 };
    const width = total_width - margin.left - margin.right;
    const height = total_height - margin.top - margin.bottom;

    // set up x & y domain
    const x_domain = d3.extent(date);
    const y_domain = [0, Math.max(...high)];
    const y_domain2 = [0, Math.max(...high)];

    // set up main x & y scales (these are functions)
    const x_scale = d3.scaleTime().domain(x_domain).range([0, width]);
    const y_scale = d3.scaleLinear().domain(y_domain).range([height, 0]).nice();

    // set up the secondary x & y scales (for the smaller brush chart)
    const x_scale2 = d3.scaleTime().domain(x_domain).range([0, width]);
    const y_scale2 = d3.scaleLinear().domain(y_domain2).range([height2, 0]);

    // create the axes
    const x_axis = d3.axisBottom(x_scale),
        x_axis2 = d3.axisBottom(x_scale2),
        y_axis = d3.axisRight(y_scale);

    // for the candlesticks
    const x_scale3 = d3.scaleLinear().domain([-1, quotes.length]).range([0, width]);
    const x_scaledate = d3.scaleQuantize().domain([0, date.length]).range(date);
    const x_band = d3.scaleBand().domain(d3.range(-1, quotes.length)).range([0, width]).padding(0.3);

    // add the svg to the page (this is an Object)
    const svg = d3.select('#stock_chart')
        .append('svg')
        .classed('svg-container', true)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${total_width} ${total_height}`)
        .append('g')
        .attr('id', 'chart');

    // brushing functionality
    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on('brush end', brushed);  // 'brush end' allows it to move as the user changes it

    // initialize the area lines
    const line = d3.area()          // line for the primary chart
        .x(function (d) { return x_scale(d.date); })
        .y0(y_scale(0))
        .y1(function (d) { return y_scale(d.close); });

    const line2 = d3.area()         // line for the subgraph
        .x(function (d) { return x_scale2(d.date); })
        .y0(y_scale2(0))
        .y1(function (d) { return y_scale2(d.close); });

    // clippath so that events/selections only occurs in the plot area
    const clip = svg.append('defs').append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0);

    // set up the gradient
    const gradient = svg.append('defs').append('linearGradient')
        .attr('id', 'chart-gradient')
        .attr('x1', '0%')       // these set up the direction of the gradient
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');    // desired: top to bottom

    // set the ending point
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(56, 56, 236, 0.3)')
        .attr('stop-opacity', 1)

    // set the start point
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(43, 93, 230, 0)')
        .attr('stop-opacity', 1)

    // overall chart. this contains the focus chart and the context chart
    const chart = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('clip-path', 'url(#clip)');

    // focus chart. this is the big chart
    const focus = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // context chart. this is the smaller chart
    const context = svg.append('g')
        .attr('class', 'context')
        .attr('transform', `translate(${margin2.left}, ${margin2.top})`);

    /************************** OPTIONAL PLOTS ****************************/
    // alternatively, the user can select candlestick
    const padding_factor = 0.90;
    const candles = chart.selectAll(".candle")
        .data(alldata)
        .enter()
        .append("line")
        .attr('class', 'candle')
        .attr("x1", (d, i) => x_scale3(i) - x_band.bandwidth() / 2)
        .attr("x2", (d, i) => x_scale3(i) - x_band.bandwidth() / 2)
        .attr("y1", d => y_scale(d.open))
        .attr("y2", d => y_scale(d.close))
        .attr("stroke", d => (d.open > d.close) ? "red" : "green")
        .attr("stroke-width", x_band.bandwidth() * padding_factor)
        .style("visibility", "hidden");

    const stems = chart.selectAll("g.line")
        .data(alldata)
        .enter()
        .append("line")
        .attr("class", "stem")
        .attr("x1", (d, i) => x_scale3(i) - x_band.bandwidth() / 2)
        .attr("x2", (d, i) => x_scale3(i) - x_band.bandwidth() / 2)
        .attr("y1", d => y_scale(d.high))
        .attr("y2", d => y_scale(d.low))
        .attr("stroke", d => (d.open > d.close) ? "red" : "green")
        .style("visibility", "hidden");

    // set up the technical overlays
    const boll_high = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function (d) { return y_scale(d.high); });

    const boll_mid = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function (d) { return y_scale(d.mid); });
    
    const boll_low = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function (d) { return y_scale(d.low); });

    //const sma_line = d3.line()
    //    .x(function (d) { return x_scale(d.date); })
    //    .y(function(d) { return y_scale(d.sma); });
    
    const ema_line = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function (d) { return y_scale(d.ema); });

    /************************** ADD PATHS AND AXES *******************************/
    /***** FOCUS, CHART, AND CONTEXT CHARTS *****/
    // add the x-axis to the big chart
    focus.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(x_axis);

    // add the y-axis to the big chart
    focus.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${width}, 0)`)
        .call(y_axis);

    // add the line to the focus chart
    chart.append('path')            // append a path tag
        .datum(linedata)            // bind the data to the line
        .attr('class', 'data-line') // class can be modified in css
        .attr('id', 'chart-line')   // id for line type stuff
        .attr('d', line)            // add the data line
        .style('fill', 'url(#chart-gradient');  // add the gradient

    // add the line to the subchart
    context.append('path')
        .datum(linedata)            // bind the data to the path
        .attr('class', 'data-line') // css class
        .attr('d', line2)           // add the subchart line
        .style('fill', 'url(#chart-gradient');  // add the gradient

    // add the x-axis to context
    context.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height2})`)
        .call(x_axis2);

    // add brushing to the context chart
    context.append('g')
        .attr('class', 'brush')
        .call(brush)
        .call(brush.move, x_scale.range());

    // boll
    chart.append('path').datum(boll)
        .attr('class', 'boll-line')
        .attr('id', 'boll-high')
        .attr('d', boll_high)
        .style('visibility', 'hidden');
    
    chart.append('path').datum(boll)
        .attr('class', 'boll-mid')
        .attr('id', 'boll-mid')
        .attr('d', boll_mid)
        .style('visibility', 'hidden');
    
    chart.append('path').datum(boll)
        .attr('class', 'boll-line')
        .attr('id', 'boll-low')
        .attr('d', boll_low)
        .style('visibility', 'hidden');
    
    // ema
    chart.append('path').datum(ema)
        .attr('class', 'ema-line')
        .attr('id', 'ema')
        .attr('d', ema_line)
        .style('visibility', 'hidden');

    // call the funny function cuz javascript is funny language
    rescalebybutton(x.max);
    /************************** END OF AXES AND PATHS ****************************/

    // stupid candle width function because d3js is failing me
    function calculateBandwidth(nelements, padding) {
        // the width of a single candle band should be:
        // npixels (width) divided by nelements - nelements*padding
        return (width / nelements - padding);
    }

    /************************ ZOOM BUTTON IMPLEMENTATION *************************/
    // add the listeners
    document.getElementById('1month').onclick = onemonth;
    document.getElementById('6month').onclick = sixmonth;
    document.getElementById('ytd').onclick = ytd;
    document.getElementById('year').onclick = year;
    document.getElementById('5year').onclick = fiveyear;
    document.getElementById('max').onclick = max;

    function onemonth() { rescalebybutton(x.month); }
    function sixmonth() { rescalebybutton(x.sixmonth); }
    function ytd() { rescalebybutton(x.ytd); }
    function year() { rescalebybutton(x.year); }
    function fiveyear() { rescalebybutton(x.fiveyear); }
    function max() { rescalebybutton(x.max); }

    // get the date closest to the provided range
    // for each, we must consider if the range causes the xmin to be before the IPO of the stock
    function getclosestdate(howfar) {
        const daysofyear = 365;
        var xmin = x_scale2.domain()[0];            // default to original min
        var xmax = x_scale2.domain()[1];            // max value of the set
        var year = xmax.getFullYear();              // XXXX not XX
        switch (howfar) {
            case x.month:       // 1 month
                var start = subtractDays(xmax, 30);     // subtract a month
                xmin = start > x_scale2.domain()[0] ? start : x_scale2.domain()[0];
                break;
            case x.sixmonth:    // 6 month
                var start = subtractDays(xmax, 240);    // subtract 6 months
                xmin = start > x_scale2.domain()[0] ? start : x_scale2.domain()[0];
                break;
            case x.ytd:         // ytd
                var start = new Date(year, 0, 0);       // 1/1/YYYY
                xmin = start > x_scale2.domain()[0] ? start : x_scale2.domain()[0];
                break;
            case x.year:        // year
                var start = subtractDays(xmax, daysofyear);    // subtract a year
                xmin = start > x_scale2.domain()[0] ? start : x_scale2.domain()[0];
                break;
            case x.fiveyear:    // 5 year
                var start = subtractDays(xmax, 5 * daysofyear);    // subtract 5 years
                xmin = start > x_scale2.domain()[0] ? start : x_scale2.domain()[0];
                break;
            default:            // max, or any other unexpected value
                xmax = x_scale2.domain()[1];
                xmin = x_scale2.domain()[0];
                break;
        }
        x_scale.domain([xmin, xmax]);
        return xmin;
    }

    function rescalebybutton(howfar) {
        // calculate values based on rescaling
        var xmin = getclosestdate(howfar);
        var xmax = x_scale.domain()[1];
        var someset = alldata.filter(function (d) { return d.date >= xmin && d.date <= xmax })
        var lows = [];
        var highs = [];
        someset.map(function (d) { lows.push(d.low); });
        someset.map(function (d) { highs.push(d.high); });

        // update the scale & axes
        y_scale.domain([Math.min(...lows), Math.max(...highs)]).nice();

        // get the index of xmin and xmax
        var minidx = 0;
        var maxidx = date.length - 1;
        for (var i = 0; i < date.length; i++) {
            if (date[i].getTime() == xmin.getTime()) {
                minidx = i;
                break;
            }
        }

        // update the bandwidth size
        var nelements = maxidx - minidx + 1;    // plus 1 cuz inclusive range
        var padding = 0.3;
        var bandwidth = calculateBandwidth(nelements, padding);

        // update candlesticks' scale
        x_scale3.domain([minidx, maxidx]).range([0, width]);

        // update candlesticks
        candles.attr("x1", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("x2", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("y1", (d) => y_scale(d.close))
            .attr("y2", (d) => y_scale(d.open))
            .attr("stroke-width", bandwidth * padding_factor);

        stems.attr("x1", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("x2", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("y1", (d) => y_scale(d.high))
            .attr("y2", (d) => y_scale(d.low))

        // update the charts
        chart.select('.data-line').attr('d', line); // update the data
        focus.select('.x-axis').call(x_axis);       // update the x-axis
        focus.select('.y-axis').call(y_axis);       // update the y-axis
    }
    /********************** END OF ZOOM BUTTON IMPLEMENTATION **********************/

    /***************************** LINE TYPE TOGGLING ******************************/
    // find the button that will do the toggling
    document.getElementById("linetype-toggler").onclick = toggleLineType;

    function toggleLineType() {
        var foo = document.getElementById("linetype-toggler").innerText;
        if (foo === "Candlestick") { // change to candlestick chart
            document.getElementById("linetype-toggler").innerText = "Line"
            chart.select("#chart-line").style("visibility", "hidden")
            chart.selectAll(".candle").style("visibility", "visible")
            chart.selectAll(".stem").style("visibility", "visible")
        } else if (foo === "Line") {
            document.getElementById("linetype-toggler").innerText = "Candlestick"
            chart.select("#chart-line").style("visibility", "visible")
            chart.selectAll(".candle").style("visibility", "hidden")
            chart.selectAll(".stem").style("visibility", "hidden")
        } else {
            console.log("js is bad")
        }
    }
    /************************** END OF LINE TYPE TOGGLING **************************/

    /************************** TECHNICAL OVERLAY TOGGLING *************************/
    // sma toggling
    var smatoggle = document.getElementById("sma-toggler")
    smatoggle.onclick = toggleSMA;
    function toggleSMA() { 
        var checked = smatoggle.dataset.checked;
        if (checked === 'false') {
            document.getElementById('sma-tip').visibility = 'visible';
            chart.select('#sma').style('visibility', 'visible');
            ematoggle.dataset.checked = 'true';
        } else {
            document.getElementById('sma-tip').visibility = 'hidden';
            chart.select('#sma').style('visibility', 'hidden');
            ematoggle.dataset.checked = 'false';
        }
    }

    // ema toggling
    var ematoggle = document.getElementById("ema-toggler")
    ematoggle.onclick = toggleEMA;
    function toggleEMA() {
        var checked = ematoggle.dataset.checked;
        if (checked === 'false') {
            document.getElementById('ema-tip').visibility = 'visible';
            chart.select('#ema').style('visibility', 'visible');
            ematoggle.dataset.checked = 'true';
        } else {
            document.getElementById('ema-tip').visibility = 'hidden';
            chart.select('#ema').style('visibility', 'hidden');
            ematoggle.dataset.checked = 'false';
        }
    }

    // boll toggling
    var bolltoggle = document.getElementById('boll-toggler');
    bolltoggle.onclick = toggleBoll;
    function toggleBoll() {
        var checked = bolltoggle.dataset.checked;
        if (checked === 'false') {
            document.getElementById('boll-high-tip').visibility = 'visible';
            document.getElementById('boll-mid-tip').visibility = 'visible';
            document.getElementById('boll-low-tip').visibility = 'visible';
            chart.select('#boll-high').style('visibility', 'visible');
            chart.select('#boll-mid').style('visibility', 'visible');
            chart.select('#boll-low').style('visibility', 'visible');
            bolltoggle.dataset.checked = 'true';
        } else {
            document.getElementById('boll-high-tip').visibility = 'hidden';
            document.getElementById('boll-mid-tip').visibility = 'hidden';
            document.getElementById('boll-low-tip').visibility = 'hidden';
            chart.select('#boll-high').style('visibility', 'hidden');
            chart.select('#boll-mid').style('visibility', 'hidden');
            chart.select('#boll-low').style('visibility', 'hidden');
            bolltoggle.dataset.checked = 'false';
        }
    }

    /********************** END OF TECHNICAL OVERLAY TOGGLING **********************/

    /*************************** BRUSHING IMPLEMENTATION ***************************/
    // strips away unnecessary date details when comparing dates
    function strip(date) {
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)
        return date;
    }

    // finds the closest index given a date
    function closestIndex(num, arr) {
        let curr = arr[0], diff = Math.abs(num - curr);
        let index = 0;
        for (let val = 0; val < arr.length; val++) {
            let newdiff = Math.abs(num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
                index = val;
            };
        };
        return index;
    }

    // update chart on user's brush selection
    function brushed() {
        var extent = d3.event.selection || x_scale2.range();
        x_scale.domain(extent.map(x_scale2.invert, x_scale2));

        // rescale the y axis
        var xmin = x_scale.domain()[0];
        var xmax = x_scale.domain()[1];
        var someset = alldata.filter(function (d) { return d.date >= xmin && d.date <= xmax })
        var lows = [];
        var highs = [];
        someset.map(function (d) { lows.push(d.low); });
        someset.map(function (d) { highs.push(d.high); });

        // update the scale & axes
        y_scale.domain([Math.min(...lows), Math.max(...highs)]).nice();

        // get the index of xmin and xmax
        var minidx = closestIndex(xmin, date);
        var maxidx = closestIndex(xmax, date);

        // update the bandwidth size
        var nelements = maxidx - minidx + 1;    // plus 1 cuz inclusive range
        var padding = 0.3;
        var bandwidth = calculateBandwidth(nelements, padding);

        // update candlesticks' scale
        x_scale3.domain([minidx, maxidx]).range([0, width]);

        // update candlesticks
        candles.attr("x1", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("x2", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("y1", (d) => y_scale(d.close))
            .attr("y2", (d) => y_scale(d.open))
            .attr("stroke-width", bandwidth * padding_factor);

        stems.attr("x1", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("x2", (d, i) => x_scale3(i) - bandwidth / 2)
            .attr("y1", (d) => y_scale(d.high))
            .attr("y2", (d) => y_scale(d.low))

        // update the charts
        chart.select('.data-line').attr('d', line); // update the data
        chart.select('#boll-high').attr('d', boll_high);
        chart.select('#boll-mid').attr('d', boll_mid);
        chart.select('#boll-low').attr('d', boll_low);
        chart.select('.ema-line').attr('d', ema_line);
        focus.select('.x-axis').call(x_axis);       // update the x-axis
        focus.select('.y-axis').call(y_axis);       // update the y-axis
    }
    /*************************** END OF BRUSHING IMPLEMENTATION ***************************/

    /******************************** TOOLTIP FUNCTIONALITY *******************************/
    // add tooltip functionality
    const hoveroverlay = focus.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', updateTooltips);

    // add the line for the tooltip
    const hoverline = focus.append('g')
        .append('rect')
        .attr('class', 'dotted')
        .attr('height', height);

    // get the tooltip elements from the html
    const tooltip = d3.select('#tooltip')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    const tooltipcircle = focus.append('circle')
        .attr('class', 'tooltip-circle')
        .attr('r', 5)
        .style('opacity', 0);

    // on mousemove to make the tooltips
    function updateTooltips() {
        // get the data point closest to the mouse
        const hoverdate = x_scale.invert(d3.mouse(this)[0]);
        const index = findClosest(hoverdate, date);
        const closest = alldata[index];
        const bolldates = date.slice(offset, date.length);
        const bollidx = findClosest(hoverdate, bolldates);
        
        // format the date
        const formatdate = d3.timeFormat('%m-%d-%Y');   // how the date is formatted in the tooltip
        tooltip.select('#date').text(formatdate(closest.date));

        // format the prices, all should have at least 2 decimal places
        //const formatprice = (d) => `$${parseFloat(d).toFixed(Math.max(2, (d.toString().split('.')[1] || []).length))}`;
        const formatprice = (d) => `$${parseFloat(d).toFixed(2)}`;
        tooltip.select('#open').html(formatprice(closest.open));
        tooltip.select('#close').html(formatprice(closest.close));
        tooltip.select('#low').html(formatprice(closest.low));
        tooltip.select('#high').html(formatprice(closest.high));
        //tooltip.select('#sma-tip').html(formatprice(sma[index]))
        tooltip.select('#ema-tip').html(formatprice(ema[index].ema))
        tooltip.select('#boll-high-tip').html(formatprice(boll[bollidx].high))
        tooltip.select('#boll-mid-tip').html(formatprice(boll[bollidx].mid))
        tooltip.select('#boll-low-tip').html(formatprice(boll[bollidx].low))

        // move the tooltips
        const x = x_scale(closest.date) + margin.left;
        const y = y_scale(closest.close) + margin.top;
        tooltip.style('opacity', 1);

        tooltipcircle.attr('cx', x_scale(closest.date))
            .attr('cy', y_scale(closest.close))
            .style('opacity', 1);

        hoverline.attr('x', x_scale(closest.date));

        //RSI.updateRSITips(d3.mouse(this)[0])
    }
    /*********************** END OF TOOLTIP FUNCTIONALITY ************************/
}