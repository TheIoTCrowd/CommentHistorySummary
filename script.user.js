// ==UserScript==
// @name         Comment History Summary
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  A quick way to review a user's comment history with number of flags and percentage displayed.
// @author       Aurora0001
// @match        https://*.stackexchange.com/admin/users/*/post-comments?state=flagged
// @match        https://stackoverflow.com/admin/users/*/post-comments?state=flagged
// @grant        none
// ==/UserScript==

// An apology: if you use a site with a special domain, you'll need to add it above in the @match.

(function() {
    'use strict';

    let url = window.location.href.split("?")[0];
    let time_filter = window.location.hash !== "" ? window.location.hash.substring(1) : null;
    let date_limit = new Date();
    if (time_filter === null) {
            date_limit.setDate(date_limit.getDate() - 10000);
        } else {
            date_limit.setDate(date_limit.getDate() - parseInt(time_filter));
        }

    $.get(url+"?state=all", data => {
        let ncomments = 0;
        let x = $(data).find(".creation-date .relativetime").each((i, x) => {if (new Date($(x).attr("title")) >= date_limit) { ncomments++ }});


        let total_flags = [];
        $(".text-row").map((i, item) => {
            let date = new Date($(item).find(".relativetime").attr("title"));

            if (date < date_limit) {
                return;
            }

            let flags = $(item).find(".deleted-info").map((i, flag) => {
                if ($(flag).text().indexOf("Deleted") !== -1) {
                    return {};
                }

                let re = /(.+) by: (.+) - (.+)/g;
                let match = re.exec($(flag).text().trim());
                return {
                    type: match[1],
                    by: match[2],
                    helpful: match[3] == "Helpful",
                };
            });

            total_flags = total_flags.concat(flags.toArray());
        });
        let flag_types = {};
        total_flags.forEach(flag => {
            if (!("type" in flag)) {
                return;
            }

            if (!(flag.type in flag_types)) {
                flag_types[flag.type] = {
                    helpful: 0,
                    declined: 0
                }
            }

            if (flag.helpful) {
                flag_types[flag.type]["helpful"] += 1;
            } else {
                flag_types[flag.type]["declined"] += 1;
            }
        });


        let results_table = document.createElement("table");

        results_table.classList += "sorter";

        $(results_table).append("<thead><tr><th>Type</th><th>Helpful</th><th>Declined</th><th>Helpful flags / number of comments</th></tr></thead>");

        for (var k in flag_types) {
            let pct = Math.ceil((flag_types[k]["helpful"]/ncomments)*100);
            let colour = "";
            if (pct >= 20) {
                colour = "supernova";
            } else if (pct >= 10) {
                colour = "hot";
            } else if (pct >= 5) {
                colour = "warm";
            }
            $(results_table).append("<tr><td>" + k + "</td><td>" + flag_types[k]["helpful"] + "</td><td>" + flag_types[k]["declined"] + '</td><td class="' + colour + '">'+ pct +"%</td></tr>");
        }

        $("table.admin-user-comments").parent().prepend(results_table);

        let nav = document.createElement("div");
        $(nav).append('<input type="text" id="dateSelector" style="height: 14px; margin-right: 7px;" placeholder="Number of days to filter" />');
        let button = document.createElement("button");
        button.style.marginBottom = "5px";
        button.innerText = "Filter";
        button.onclick = () => {
            let time = $("#dateSelector").val();
            window.location.hash = "#" + time;
            location.reload();
        };

        $(nav).append(button);

        $("table.admin-user-comments").parent().prepend(nav);

        if (time_filter !== null) {
            $("table.admin-user-comments").parent().prepend("<h3>Filtered for last " + time_filter + " days</h3>");
        }
    });

})();
