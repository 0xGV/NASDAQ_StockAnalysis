/**
 * ============================================================================
 * linker.js -- This ensures that whatever Bootstrap tab you're on will persist
 *  thru reloads. (i.e. specific tabs can be linked directly)
 * ============================================================================
 */

function linkme() { 
    let url = location.href.replace(/\/$/, "");     // remove trailing /, if any

    // if there is a hash sign, go to the correct tab
    if (location.hash) {
        const hash = url.split("#");
        tab = hash[1];
        document.getElementById(tab).click();
    }

    // when a different tab is clicked, change the url
    $('button[data-bs-toggle="tab"]').on("click", function () {
        let newUrl;
        const hash = $(this).attr("href");
        newUrl = url.split("#")[0] + hash;
        history.replaceState(null, null, newUrl);
    });
}