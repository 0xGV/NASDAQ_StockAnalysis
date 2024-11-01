/**
 * ============================================================================
 * 404.js -- Handles the 'did you mean' stuff on the 404 page
 * ============================================================================
 */

function load404() {
    navByEnter();
    meanyoudid();
}

function meanyoudid() {
    if (didyoumean.length <= 0) return;
    var url = window.location.origin + "/chart/";

    d3.select("#did-you-mean-parent")
        .append('i')
        .text("Did you mean...")
    for (var i = 0; i < didyoumean.length; i++) {
        d3.select("#did-you-mean")
            .append('li')
            .attr('class', 'col')
            .append('a')
            .attr('class', 'inline-link')
            .attr('href', url + didyoumean[i])
            .text(didyoumean[i]);
    }
}
