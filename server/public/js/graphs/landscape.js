﻿/**
 * LANDSCAPE GRAPH 
 * Creates a landscape using d3.js (https://d3js.org/)
 */ 
function landscapeGraph(_options) {
    // options settings 
    var options = $.extend({
        containerName: null,
        tooltipClass:  null,
        landmarkClass: null,
        margin: { top: 20, left: 20, bottom: 20, right: 20 },
        color: {
            points:     "#A289FE", 
            background: "#FFFFFF"
        }
    }, _options);

    /**
     * Object variables
     */ 
    var zoom = null,
        xScale = null,
        yScale = null,
        rScale = null,

        landmarks = null,
        landscapeBody = null;

    /**
     * Database container.
     * @property {Array.<Object>} points - The landscape points.
     * @property {Array.<Object>} landmarks - The landmark tags. Constructed dynamically.
     */ 
    var landscapeData = {
        points:    null,
        landmarks: null
    };

    /**
     * Get the landscape data.
     * @returns {Object} A JSON object containing the landscape data.
     */ 
    this.getLandscapeData = function () { 
        return landscapeData;
    }

    /**
     * Set the landscape data.
     * @param {Object} _data - Contains the landscape data.
     * @param {Array.<Object>} _data.points - Contains the points. 
     */ 
    this.setLandscapeData = function (_data) {
        // if the points data is not contained
        if (!_data.points) {
            throw "landscapeGraph.setLandscapeData: must contain the points data!";
        }
        landscapeData.points = _data.points;
    }

    /**
     * Prepare the landscape graph display.
     */ 
    function prepareLandscapeDisplay() {
        
        if (!options.containerName) {
            throw "landscapeGraph: must set containerName before preparing the display!";
        }
        var totalWidth = $(options.containerName).width(),
            totalHeight = $(options.containerName).height(),
            width = totalWidth - options.margin.left - options.margin.right,
            height = totalHeight - options.margin.top - options.margin.bottom;
        
        // remove the previous SVG contained elements
        d3.select(options.containerName + " svg").remove();
        
        // zoom object
        zoom = d3.behavior.zoom();
        
        // create the SVG container
        svg = d3.select(options.containerName)
                    .append("svg")
                    .attr("id", "landscape-container")
                    .attr("width", totalWidth)
                    .attr("height", totalHeight)
                    .append("g")
                    .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")")
                    .call(zoom);
        
        svg.append("rect")
           .attr("fill", options.color.background)
           .attr("width", width)
           .attr("height", height);
        
        // area clip
        svg.append("clipPath")
           .attr("id", "area-clip")
           .append("rect")
           .attr("x", 0)
           .attr("y", 0)
           .attr("width", width)
           .attr("height", height);
        
        landscapeBody = svg.append("g")
                           .attr("clip-path", "url(#area-clip)");
        
        // prepare the 'padding' for the points
        // this will make sure that points are not cut off in half
        var padding = { left: 30, right: 30, top: 30, bottom: 30 };
        
        // calulate the minimum and maximum range for the x, y scales
        // based on the number of data points
        var minX, maxX, minY, maxY;
        var minXY = Math.abs(width - height) / 2,
            maxXY = Math.abs(width + height) / 2;
        
        if (width <= height) {
            minX = 0;
            maxX = width;
            minY = minXY;
            maxY = maxXY;
        } else {
            minX = minXY;
            maxX = maxXY;
            minY = 0;
            maxY = height;
        }
        
        xScale = d3.scale.linear()
                   .domain([0, 1])
                   .range([minX, maxX]);
        
        yScale = d3.scale.linear()
                    .domain([0, 1])
                    .range([minY, maxY]);
        
        // get the maximum number of views
        var maxView = Math.max.apply(null, $.map(landscapeData.points, function (pt) { return pt["views"] }));
        
        rScale = d3.scale.linear()
                   .domain([0, maxView])
                   .range([2, 10]);
        
        function onZoom() {
            landscapeBody.selectAll(".point")
                         .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            if (options.landmarkFunctions) {
                landmarks = chartBody.selectAll(".landmark")
                                     .attr("x", function (d) { return xScale(d.x) - d.width / 2; })
                                     .attr("y", function (d) { return yScale(d.y); });
            }
        }
        
        // zoom configure
        zoom.x(xScale)
            .y(yScale)
            .scaleExtent([1, 5])
            .on("zoom", onZoom);
        
            // prepare the tooltip container
        if (options.tooltipClass){
            // remove previous tooltip and construct a new one
            $("#landscape-tooltip").remove();
            $(options.containerName).append("<div id=\"landscape-tooltip\" class=\"notvisible\"></div>");
    }
    }

    /**
     * Redraws the landscape.
     */ 
    function redraw() { 
        var totalWidth = $(options.containerName).width(),
            totalHeight = $(options.containerName).height(),
            width = totalWidth - options.margin.left - options.margin.right,
            height = totalHeight - options.margin.top - options.margin.bottom;

        var LSPoints = landscapeBody.selectAll(".point")
                                    .data(landscapeData.points);
        
        LSPoints.attr("cx", function (d) { return xScale(d.x); })
                .attr("cy", function (d) { return yScale(d.y); })
                .attr("r", function (d) { return rScale(d["views"]); });
        
        LSPoints.exit().remove();

        LSPoints.enter().append("circle")
                .attr("class", "point")
                .attr("cx", function (d) { return xScale(d.x); })
                .attr("cy", function (d) { return yScale(d.y); })
                .attr("r", function (d) { return rScale(d["views"]); })
                .attr("fill", options.color.points);

        /**
         * Construct tooltip.
         */ 
        landscapeBody.selectAll(".point")
                     .on("mouseover", function (d, idx) {
                         coords = [xScale(d.x), yScale(d.y)];
                         $(this).css("fill", d3.rgb(options.color.points).brighter(1));
                         // if tooltip can be created
                         if (options.tooltipClass) {
                             var tooltipDiv = $("#landscape-tooltip");
                             tooltipDiv.html(options.tooltipClass.CreateText(d));
                             var x = coord[0] + options.margin.left;
                             var y = coord[1] + options.margin.top;
                             var scale = rScale(d["views"]) * zoom.scale();
                             var xOffset = (coords[0] > ($(options.containerName).width() / 2)) ? (-tooltipDiv.outerWidth() - scale) : scale;
                             var yOffset = (coords[1] > ($(options.containerName).height() / 2)) ? (-tooltipDiv.outerHeight() + 60) : -60;
                             tooltipDiv.css({ left: (x + xOffset) + "px", top: (y + yOffset) + "px" })
                                       .removeClass("notvisible");
                         }
                     }).on("mouseout", function (d, idx) {
                         // hide the tooltip
                         $(this).css("fill", d3.rgb(options.color.points));
                         if (options.tooltipClass) {
                             $("#landscape-tooltip").addClass("notvisible");
                         }
                     });
    }
}