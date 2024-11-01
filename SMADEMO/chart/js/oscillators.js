/**
 * ============================================================================
 * oscillators.js -- This populates the statistics table on the chart page
 * ============================================================================
 */

// generates the RSI chart
function RSI(dates, rsidata) {
    // preprocess data
    var date = new Array(),
        rsi = new Array(),
        linedata = new Array(),
        overbought = new Array(),
        oversold = new Array();
    
    for (var i = 0; i < rsidata.length; i++) {
        date.push(makeDate(dates[i]));
        rsi.push(rsidata[i]);
        linedata.push({
            date: date[i],
            rsi: rsi[i]
        });
        overbought.push({ date: date[i], rsi: 70 });
        oversold.push({ date: date[i], rsi: 30 });
    }

    /*************************** INITIALIZATIONS *********************************/
    // initialize sizes
    const total_height = 120;
    const total_width = 680;            // should be the same as the main chart
    const margin = { top: 15, right: 40, bottom: 30, left: 20 };
    const width = total_width - margin.left - margin.right;
    const height = total_height - margin.top - margin.bottom;

    // domains
    const x_domain = d3.extent(date);
    const y_domain = [0, 100];

    // scales
    const x_scale = d3.scaleTime().domain(x_domain).range([0, width]);
    const y_scale = d3.scaleLinear().domain(y_domain).range([height, 0]);

    // axes
    const x_axis = d3.axisBottom(x_scale),
        y_axis = d3.axisRight(y_scale).ticks(5);
    
    /***************************** COMPONENTS **********************************/
    // svg
    const svg = d3.select('#rsi-chart')
        .append('svg')
        .classed('svg-container', true)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${total_width} ${total_height}`)
        .append('g')
        .attr('id', 'rsi-svg');
    
    // line
    const line = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function(d) { return y_scale(d.rsi); });

    // clippath, so events/selections only occur in the plot
    const clip = svg.append('defs').append('svg:clipPath')
        .attr('id', 'clip-rsi')
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0);

    // chart body
    const chart = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('clip-path', 'url(#clip-rsi)');

    // actual chart
    const focus = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    /***************************** ASSEMBLE **********************************/
    // add x-axis to focus
    focus.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(x_axis);

    // add y-axis to focus
    focus.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${width}, 0)`)
        .call(y_axis);
    
    // add oversold line
    focus.append('path')
        .datum(oversold)
        .attr('class', 'signal-line')
        .attr('d', line);
    
    // add overbought line
    focus.append('path')
        .datum(overbought)
        .attr('class', 'signal-line')
        .attr('d', line);

    // add the line to the body
    focus.append('path')
        .datum(linedata)
        .attr('class', 'rsi-line')
        .attr('d', line);

    /******************************** TOOLTIP FUNCTIONALITY *******************************/
    // add tooltip functionality
    const hoveroverlay = focus.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', updateRSITips);
    
    // add hoverline
    const hoverline = focus.append('g')
        .append('rect')
        .attr('class', 'dotted')
        .attr('height', height);
    
    // tooltip elements from the html
    const tooltip = d3.select('#tooltip-rsi')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const tooltipcircle = focus.append('circle')
        .attr('class', 'tooltip-circle')
        .attr('r', 3)
        .style('opacity', 0);

    // on mousemove, show some tooltips
    function updateRSITips(mouseevent) {
        // get the data point closest to the mouse
        //const hoverdate = x_scale.invert(d3.mouse(this)[0]);
        if (mouseevent === undefined || mouseevent === null) {
            mouseevent = d3.mouse(this)[0];
        }
        const hoverdate = x_scale.invert(mouseevent)
        const index = findClosest(hoverdate, date);
        const closest = linedata[index];

        // format
        const formatdate = d3.timeFormat('%m-%d-%Y');
        const formatprice = (d) => `${parseFloat(d).toFixed(2)}`;
        tooltip.select('#rsi-date').html(formatdate(closest.date));
        tooltip.select('#rsi-rsi').html(formatprice(closest.rsi));

        // move the tooltips
        tooltip.style('opacity', 1);

        tooltipcircle.attr('cx', x_scale(closest.date))
            .attr('cy', y_scale(closest.rsi))
            .style('opacity', 1);

        hoverline.attr('x', x_scale(closest.date));
    }
}

function MACD(dates, macddata, signaldata) {
    // preprocess data
    var date = new Array(),
        macdline = new Array(),
        signalline = new Array();
    
    for (var i = 0; i < dates.length; i++) {
        date.push(makeDate(dates[i]));
    }
    const offset = dates.length - macddata.length;
    for (var i = 0; i < macddata.length; i++) {
        macdline.push({ date: date[i+offset], macd: macddata[i] });
    }
    const soffset = dates.length - signaldata.length;
    console.log(offset, soffset);
    for (var i = 0; i < signaldata.length; i++) {
        signalline.push({ sdate: date[i+soffset], signal: signaldata[i] });
    }

    /*************************** INITIALIZATIONS *********************************/
    // initialize sizes
    const total_height = 120;
    const total_width = 680;            // should be the same as the main chart
    const margin = { top: 15, right: 40, bottom: 30, left: 20 };
    const width = total_width - margin.left - margin.right;
    const height = total_height - margin.top - margin.bottom;

    // domains
    const macdmax = Math.max(...macddata)
    const signalmax = Math.max(...signaldata)
    const macdmin = Math.min(...macddata)
    const signalmin = Math.min(...signaldata)
    const x_domain = d3.extent(date);
    const y_domain = [macdmin < signalmin ? macdmin : signalmin, macdmax > signalmax ? macdmax : signalmax];

    // scales
    const x_scale = d3.scaleTime().domain(x_domain).range([0, width]);
    const y_scale = d3.scaleLinear().domain(y_domain).range([height, 0]);

    // axes
    const x_axis = d3.axisBottom(x_scale),
        y_axis = d3.axisRight(y_scale).ticks(5);
    
    /***************************** COMPONENTS **********************************/
    // svg
    const svg = d3.select('#macd-chart')
        .append('svg')
        .classed('svg-container', true)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${total_width} ${total_height}`)
        .append('g')
        .attr('id', 'macd-svg');
    
    // lines
    const line = d3.line()
        .x(function (d) { return x_scale(d.date); })
        .y(function(d) { return y_scale(d.macd); });
    
    const signal = d3.line()
        .x(function (d) { return x_scale(d.sdate); })
        .y(function(d) { return y_scale(d.signal); });

    // clippath, so events/selections only occur in the plot
    const clip = svg.append('defs').append('svg:clipPath')
        .attr('id', 'clip-macd')
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', 0)
        .attr('y', 0);

    // chart body
    const chart = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .attr('clip-path', 'url(#clip-macd)');

    // actual chart
    const focus = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    /***************************** ASSEMBLE **********************************/
    // add x-axis to focus
    focus.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(x_axis);

    // add y-axis to focus
    focus.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(${width}, 0)`)
        .call(y_axis);
    
    // add the line to the body
    focus.append('path')
        .datum(macdline)
        .attr('class', 'macd-line')
        .attr('d', line);

    focus.append('path')
        .datum(signalline)
        .attr('class', 'macd-signal')
        .attr('d', signal)

    /******************************** TOOLTIP FUNCTIONALITY *******************************/
    // add tooltip functionality
    const hoveroverlay = focus.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', updateMACDTips);
    
    // add hoverline
    const hoverline = focus.append('g')
        .append('rect')
        .attr('class', 'dotted')
        .attr('height', height);
    
    // tooltip elements from the html
    const tooltip = d3.select('#tooltip-macd')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const tooltipcircle = focus.append('circle')
        .attr('class', 'tooltip-circle')
        .attr('r', 3)
        .style('opacity', 0);

    // on mousemove, show some tooltips
    function updateMACDTips() {
        // get the data point closest to the mouse
        const hoverdate = x_scale.invert(d3.mouse(this)[0]);
        const index = findClosest(hoverdate, date);
        const cmacd = macdline[index - offset];
        const csignal = signalline[index - soffset];

        // format
        const formatdate = d3.timeFormat('%m-%d-%Y');
        const formatprice = (d) => `${parseFloat(d).toFixed(2)}`;

        tooltip.select('#macd-date').html(formatdate(cmacd.date));
        tooltip.select('#macd-macd').html(formatprice(cmacd.macd));
        tooltip.select('#macd-signal').html(formatprice(csignal.signal));

        // move the tooltips
        tooltip.style('opacity', 1);
        tooltipcircle.attr('cx', x_scale(cmacd.date))
            .attr('cy', y_scale(cmacd.macd))
            .style('opacity', 1);
        hoverline.attr('x', x_scale(cmacd.date));
    }
}

