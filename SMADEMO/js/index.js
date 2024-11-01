/**
 * ============================================================================
 * index.js -- Handles search functionality on the index page.
 * ============================================================================
 */

function indexMain() {
    searchByEnter();        // establish search-by-enter
    navByEnter();           // establish navbar search-by-enter
}

function mainSearch() {
    var input = document.getElementById("sbar").value.toString();
    window.location = window.location.origin + "/chart/" + input.toUpperCase();
}

function searchByEnter() {
    // Get the input field
    var input = document.getElementById("sbar");

    // Execute a function when the user releases a key on the keyboard
    input.addEventListener("keyup", function (event) {
        if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            event.preventDefault();                     // cancel default action
            document.getElementById("sbutton").click();   // trigger button click
        }
    });
}