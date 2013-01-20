$(function () {
    $(".marginal-link").each(function (i, e) {
        var $e = $(e);
        $e.html('<a href="javascript:show_popup('
                + $e.attr('id') + ')">✻</a>');
    });

    create_top_topics_list();
    
        if (window.location.href.search("\\?topic") != -1) {
            // We came in through a link to a particular place in the
            // document.  Scroll up a bit so that the header doesn't
            // get in the way.
            var topic = window.location.href.split("?topic")[1];
            show_popup(parseInt(topic), center=true);
        } else if (window.location.href.search("\\?explain") != -1) {
            // We came in through a link to a particular place in the
            // document.  Scroll up a bit so that the header doesn't
            // get in the way.
            var topic = window.location.href.split("?explain")[1];
            explain_topic(parseInt(topic));
        }

    // We don't want to immediately hide the popup if the user clicks
    // on a link that might open something else.
    $(".marginal-link").mouseup(function () {return false;});
    $(".explanation-link").mouseup(function () {return false;});
});
