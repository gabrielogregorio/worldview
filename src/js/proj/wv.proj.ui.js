/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.proj
 */
var wv = wv || {};
wv.proj = wv.proj || {};

/**
 * Undocumented.
 *
 * @class wv.proj.ui
 */
wv.proj.ui = wv.proj.ui || function(models, config) {

    var model = models.proj;

    var self = {};
    var $button;
    var $label;
    var $menuItems;

    var selector = "#wv-proj-button";
    var id = "wv-proj-button";

    var init = function() {
        if ( config.ui && config.ui.projections ) {
            render();
        }
    };

    var render = function() {
        $button = $("<input></input>")
            .attr("type", "checkbox")
            .attr("id", "wv-proj-button-check");
        $label = $("<label></label>")
            .attr("for", "wv-proj-button-check")
            .attr("title", "Switch projection");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-globe")
            .addClass("fa-2x");
        $label.append($icon);
        $(selector).append($label);
        $(selector).append($button);
        $button.button({
            text: false
        });

        var $menu = $("<div></div>").attr("id", "wv-proj-menu");
        $menuItems = $("<ul></ul>");

        _.each(config.ui.projections, function(ui) {
            var $item = $(
                "<li>" +
                "<a data-proj='" + ui.id + "'>" +
                "<i class='ui-icon icon-large " + ui.style + "'>" +
                "</i>" + ui.name + "</a></li>");
            $menuItems.append($item);
            $item.click(function() {
                models.proj.select(ui.id);
                $("#wv-proj-button-check").prop("checked", false);
                $button.button("refresh");
            });
        });

        $menu.append($menuItems);
        $("body").append($menu);

        $menuItems.hide().menu();

        $button.click(function(event) {
            event.stopPropagation();
            $(".ui-menu").hide();
            wv.ui.closeDialog();
            var checked = $("#wv-proj-button-check").prop("checked");
            if ( checked ) {
                show();
            }
        });
    };

    var show = function() {
        $menuItems.show().position({
            my: "left top",
            at: "left bottom+5",
            of: $label
        });
        $("#wv-proj-menu a").removeClass("wv-menu-item-selected");
        $("#wv-proj-menu a[data-proj='" + models.proj.selected.id + "']")
            .addClass("wv-menu-item-selected");
        $("body").one("click", function(event) {
            if ( $button.parent().has(event.target).length > 0 ) {
                return;
            }
            $menuItems.hide();
            $("#wv-proj-button-check").prop("checked", false);
            $button.button("refresh");
        });
    };

    init();
    return self;

};
