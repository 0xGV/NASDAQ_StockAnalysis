/**
 * ============================================================================
 * navbar.js -- This janky code injects the navbar into the page
 * This serves the entire site to ensure consistency across pages
 * ============================================================================
 */

var html = `
    <!-- navbar -->
    <nav class="navbar navbar-expand-lg bg-nav">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">Stock Market Analyzer</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false"
                aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                        data-bs-toggle="dropdown" aria-expanded="false">Explore</a>
                        <ul class="dropdown-menu bg-nav" aria-labelledby="navbarDropdown">
                            <li><a class="nav-link dropdown-item" href="/explore#picks">StockPicker's Top Picks</a></li>
                            <li><a class="nav-link dropdown-item" href="/explore#gainers">Top Gainers</a></li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button"
                        data-bs-toggle="dropdown" aria-expanded="false">Learn</a>
                        <ul class="dropdown-menu bg-nav" aria-labelledby="navbarDropdown">
                            <li><a class="nav-link dropdown-item" href="/learn#technical">Technical Analysis</a></li>
                            <li><a class="nav-link dropdown-item" href="/learn#fundamental">Fundamentals</a></li>
                            <li><a class="nav-link dropdown-item" href="/learn#stockpicker">Stock Picker</a></li>
                        </ul>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/about">About</a>
                    </li>
                </ul>
                <input class="search-bar me-2" id="s" placeholder="Search for a symbol!">
                <button type="submit" class="btn btn-outline-sma" id="snavbutton" onClick="searchUrl()" >Search</button>
            </div>
        </div>
    </nav>
    <!-- end of navbar -->
`;

// inject the html
document.getElementById("navbar-parent").innerHTML = html;
 
function navByEnter() {
    // Get the input field
    var input = document.getElementById("s");

    // Execute a function when the user releases a key on the keyboard
    input.addEventListener("keyup", function (event) {
        if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            event.preventDefault();                         // cancel default action
            document.getElementById("snavbutton").click();  // trigger button click
        }
    });
}

// handles submission for search query
function searchUrl() {
    var input = document.getElementById("s").value.toString();
    var accepted = /^[a-zA-Z]+$/;

    // do some checks to prevent bad input
    if (input.match(accepted)) {
        window.location = window.location.origin + "/chart/" + input.toUpperCase();
    } else {
        document.getElementById("s").value = "Letters only please!";
    }
}
