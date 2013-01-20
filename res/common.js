function create_top_topics_list()
{
    var html = ["<div style='float:right'><table id='top-topic-table'>"];
    var ntopics = top_topics.length;
    var nrows = 3, ncols = 3;
    for (var i = 0; i < nrows; i++) {
        html.push("<tr>");
        for (var j = 0; j < ncols; j++) {
            var k = i + j * nrows;
            if (k >= ntopics) break;
            var topic = top_topics[k];
            var topic_name = topic_names[topic].split(" ").slice(0, 3).join(" ");
            html.push("<td>" + (k + 1) + ". "
                      + "<a class='explanation-link' id='explanation-link"
                      + topic + "' href='javascript:explain_topic("
                      + topic + ")'>" + topic_name
                      + "</a></td>");
        }
        html.push("</tr>");
    }
    html.push("</table></div>");
    html.push("<div style='float:right'>Top topics in this document:</div>");
                
    $(html.join("")).appendTo($("#top-topic-area"));
}


var current_popup = null;
var current_popup_full = false;

function show_popup(topic, center)
{
    hide_explanation();
    _show_popup(topic, false, false, 'center', center=center);

    $(document).unbind("mouseup");
    $(document).one("mouseup", hide_popup);
}

function hide_popup()
{
    $("#popup, #popup-content").animate({"width": 30}, duration=150,
                        complete=function () {
                            $("#popup").remove();
                            $(".topic-link").css("color", "");
                            $(".marginal-link a").css("color", "");
                            hide_explanation_quick();
                            current_popup = null;
                        });
}

function show_index_popup(topic)
{
    _show_popup(topic, true, false, 'top');

    $(document).unbind("mouseup");
    $(document).one("mouseup", hide_popup);
}

function _show_popup(topic, full, fixed, notch_pos, center)
{
    if (topic == current_popup
        && current_popup_full == !!full) return;

    // Update link colors.
    $("#popup").remove();
    $(".topic-link").css("color", "");
    $(".marginal-link a").css("color", "");
    $("#" + topic + " a").css("color", "red");

    // Construct the popup contents.
    var html = [];

    html.push(topic_names[topic]);

    var docs = docs_by_pointed_topic[topic] || [];
    var ndocs = docs.length;

    if (full) {
        if (ndocs)
            html.push("<hr />Exemplary passages:<br />");
        else
            html.push("<hr />No exemplary passages for this topic.<br />");
    } else {
        if (ndocs > 1)
            html.push("<hr />Other exemplary passages for this topic:<br />");
        else
            html.push("<hr />No other exemplary passages for this topic.<br />");
    }

    var docs_listed = {};
    for (var i = 0; i < ndocs; i++) {
        var doc = docs[i];
        if (!full && doc == this_doc) {
            continue;
        }
        docs_listed[doc] = true;
        if (doc == this_doc)
            html.push("<a href='javascript:show_popup(" + topic + ")'>");
        else
            html.push("<a href='" + doc + ".html?topic" + topic + "'>");
        html.push(doc);
        html.push("</a>");
        html.push(": ...");
        html.push(extracts[doc][topic]);
        html.push("...<br />");
    }

    if (full) {
        var docs = docs_by_topic[topic] || [];
        var ndocs = docs.length;
        if (this_doc) {
            if (ndocs > 1)
                html.push("<hr />Other documents with this topic in the top 9:<br />");
            else
                html.push("<hr />No other documents with this topic in the top 9.<br />");
        } else {
            if (ndocs)
                html.push("<hr />Documents with this topic in the top 9:<br />");
            else
                html.push("<hr />No documents with this topic in the top 9.<br />");
        }
        for (var i = 0; i < ndocs; i++) {
            var doc = docs[i];
            if (doc == this_doc || doc in docs_listed) {
                continue;
            }
            html.push("<a href='" + doc + ".html?explain" + topic + "'>");
            html.push(doc);
            html.push("</a>: ");
            html.push(doc_names[doc]);
            html.push("<br />");
        }
    } else {
        html.push('<hr /><a href="javascript:explain_topic('
                  + topic + ')">Explain the relevance of this topic</a>');
    }

    html = html.join('');

    var total_height;
    if ($(".index-entry").length) {
        total_height = $(".index-entry").length
            * ($(".first-row .index-entry").height()
               + parseInt($(".first-row .index-entry").css("padding-top"))) + 1;
    } else {
        var total_height = $("#popup-area").parent().height();
    }
    var popup = $("<div id='popup' class='popup'>"
                  + "<div id='popup-content'>"
                  + html + "</div></div>")
        .css("position", "relative")
        .appendTo("#popup-area");

    var popup_width = popup.width();
    if (current_popup === null)
        popup.css("width", 30); // Start out small for the animation.

    if (!fixed) {
        // Figure out where to position the popup.
        var rownum = $("#text-table > tbody").children()
            .index($("#" + topic).parent().parent());
        if (rownum == -1) 
            rownum = $("#text-table > tbody").children()
                .index($("#" + topic).parent());
        var nrows = $("#text-table .text-line").length 
            || $("#text-table .index-entry").length;
        var yoffset = total_height * rownum / nrows;

        // Figure out where to position the notch on the left.
        var notch_offset;
        if (notch_pos == 'center') {
            yoffset -= $("#popup-content").height() / 2;
            if (yoffset < 0)
                yoffset = 0;
            popup.css("top", yoffset);
            if (yoffset == 0)
                notch_offset = (total_height * (rownum + 0.5) / nrows
                                - $("#popup-area").height() - 15);
            else
                notch_offset = -($("#popup-area").height() / 2) - 15;
        } else if (notch_pos == 'top') {
            yoffset -= 30;
            if (yoffset < 0)
                yoffset = 0;
            popup.css("top", yoffset);
            if (yoffset == 0)
                notch_offset = (total_height * (rownum + 0.5) / nrows
                                - $("#popup-area").height() - 15);
            else
                notch_offset = -$("#popup-content").height() + 30 - 15;
            if (notch_offset + $("#popup-content").height() < 15) {
                // The notch is at the edge.  Don't round this corner.
                $("#popup-content").css("-moz-border-top-left-radius", 0)
                    .css("-webkit-border-top-left-radius", 0)
                    .css("-khtml-border-top-left-radius", 0)
                    .css("border-top-left-radius", 0);
            }
        }

        $("<img src='notch-left.png'></img>")
            .css("position", "relative")
            .css("left", -14)
            .css("top", notch_offset)
            .appendTo("#popup");

        if (notch_pos == 'center') {
            // Auto-scroll so that the popup is as fully on-screen as possible.
            var sel = ($.browser['msie'] || $.browser['mozilla'])? "html": "body";
            if (center) {
                // Scroll so that the popup is centered.
                $(sel).scrollTop(Math.max($("#popup-content").offset().top
                                          + $("#popup-content").height() / 2
                                          - $(window).height() / 2,
                                          0))
            } else if ($(sel).scrollTop() > $("#popup-content").offset().top - 100) {
                $(sel).animate({
                    scrollTop: $("#popup-content").offset().top - 100
                }, 400);
            } else if ($(sel).scrollTop() + $(window).height()
                < $("#popup-content").offset().top + $("#popup-content").height() + 30) {
                $(sel).animate({
                    scrollTop: $("#popup-content").offset().top
                        + $("#popup-content").height() - $(window).height() + 30
                }, 400);
            }
        }
    } else {
        // Set up a fixed-position popup.
        var popup_height = popup.height();
        var max_height = $(window).height() - 150;
        if (popup_height > max_height) {
            $("#popup-content").css("height", max_height)
                .css("overflow-y", "scroll");
        }

        $("#popup-content").css("position", "fixed");
        $("#popup-content").css("top", 100);
    }

    if (current_popup === null)
        popup.animate({"width": popup_width}, duration=150);
    else
        popup.css("width", popup_width);

    $("#popup").mouseup(function () {return false;});
        
    current_popup = topic;
    current_popup_full = full;
}


var current_explanation = null;
var current_explanation_has_density_fcn = false;

function explain_topic(topic)
{
    if (topic == current_explanation) return;

    $(".marginal-link a").css("color", "");
    $("#" + topic + " a").css("color", "red");

    $(".explanation-link").css("color", "");
    $("#explanation-link" + topic).css("color", "red");

    $('[class^="topic"]').css("background-color", "");
    $(".topic" + topic).css("background-color", "red");

    var canvas = $("#chart");
    var density_fcn = density_fcns[topic];
    var density_max = 0.0;

    if (density_fcn) {
        for (var i = 0; i < density_fcn.length; i++) {
            if (density_fcn[i] > density_max) {
                density_max = density_fcn[i];
            }
        }

        if (current_explanation === null
            || !current_explanation_has_density_fcn)
            $("#chart-area").css("width", 10);

        var w = 100,
            h = $("#chart-cell").height(),
            x = pv.Scale.linear(0, density_max).range(0, w - 5),
            y = pv.Scale.linear(-0.5, density_fcn.length - 0.5).range(h, 0);

        var vis = new pv.Panel()
            .canvas("chart")
            .width(w)
            .height(h);

        vis.add(pv.Area)
            .data(density_fcn)
            .left(0)
            .width(function (d) {return x(d)})
            .bottom(function (d) {return y(this.index)})
            .fillStyle("#fee")
          .anchor("right").add(pv.Line)
            .lineWidth(2)
            .strokeStyle("red");

        vis.render();

        // Don't animate if there's already a chart visible.
        if (current_explanation === null
            || !current_explanation_has_density_fcn) {
            $("#chart-area").animate({"width": 100}, duration=15,
                                     complete=(function (topic) {
                                         return function () {
                                             _show_popup(topic, true, true);
                                         }
                                     })(topic));
        } else {
            _show_popup(topic, true, true);
        }
    } else {
        // No density function available.
        if (current_explanation !== null
            && current_explanation_has_density_fcn) {
            $("#chart-area").animate({"width": 10}, duration=150,
                                     complete=(function (topic) {
                                         return function () {
                                             _show_popup(topic, true, true);
                                             $("#chart").html('');
                                             $("#chart-area").css("width", null);
                                         }
                                     })(topic));
        } else {
            _show_popup(topic, true, true);
        }
    }

    $(document).unbind("mouseup");
    $(document).one("mouseup", hide_explanation_and_popup);

    current_explanation = topic;
    current_explanation_has_density_fcn = !!density_fcn;
}

function hide_explanation()
{
    if (current_explanation === null)
        return;
    $("#chart-area").animate({"width": 10}, duration=150,
                             complete=function () {
                                 $(".explanation-link").css("color", "");
                                 $('[class^="topic"]').css("background-color", "");
                                 $("#chart").html('');
                                 $("#chart-area").css("width", null);
                                 current_explanation = null;
                             });
}

function hide_explanation_quick()
{
    $(".explanation-link").css("color", "");
    $('[class^="topic"]').css("background-color", "");
    $("#chart").html('');
    $("#chart-area").css("width", null);
    current_explanation = null;
}

function hide_explanation_and_popup()
{
    hide_popup();
    hide_explanation_quick();
}
