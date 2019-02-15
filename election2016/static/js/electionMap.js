var countygeos = [];
var electiondata = [];
var colordata = [];

var electionMap = function (opts) {

    // load in arguments from config object
    this.geo = opts.geo;
    this.element = opts.element;
    this.view = opts.view;

    this.colors = {
        blank: "#CCC" //Would add additional colors to our lookup here
    }

    electiondata = votedata;

    // create the Map
    this.draw();
    this.setView();
    this.update();

}

electionMap.prototype.draw = function () {

    //Set width/height/margins
    this.setDimensions();

    // set up parent element and SVG
    this.element.innerHTML = "";
    this.svg = d3.select(this.element).append('svg');

    this.element.style.width = this.width;
    this.svg.attr('width', this.width);
    this.svg.attr('height', this.height);

    this.centered = null; //Store path data if map is zoomed to path
    this.isZoomed = false; //Store path data if map is zoomed to path
    this.maxZoom = 5; //Level to zoom into when area or region is clicked.
    this.lineStroke = .5; //Stroke width to maintain at various zoom levels.

    this.homeButton(); //Add a "reset map" button to the target element

    // we'll actually be appending to a <g> element
    this.plot = this.svg.append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
        .attr("class", "map-g");

    //Append an invisible background element so we have something to click on in negative space
    this.plot.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.width)
        .attr("height", this.height)
        .on("click", function (d) {
            var el = this;
            if (_this.isZoomed) {
                _this.clicked(d, el);
            }
        });

    //Append the tooltip div to the map target
    this.tooltipDiv = d3.select(this.element)
        .append("div")
        .attr("class", "tooltip");

    //Set the projection according to width/height
    this.resetProjection();

    /* DRAW THE MAP FEATURES */
    var _this = this; //Store value of this for use inside selection-nested functions

    /* ------------------- */
    /* STATES */
    /* ------------------- */

    var states = this.plot.append("g")
        .attr("class", "states-g");

    states.selectAll("path")
        .data(topojson.feature(this.geo, this.geo.objects.states).features)
        .enter().append("path")
        .attr("d", _this.path)
        .attr("class", "state feature");

    /* END STATES */
    /* ------------------- */

    /* ------------------- */
    /* COUNTIES */
    /* ------------------- */
    countygeos = this.geo.objects.counties.geometries;

    var counties = this.plot.append("g")
        .attr("class", "counties-g");

    counties.selectAll("path")
        .data(topojson.feature(this.geo, this.geo.objects.counties).features)
        .enter().append("path")
        .attr("d", _this.path)
        .attr("class", "county feature");


    /* END COUNTIES */
    /* ------------------- */


    //Assign mouse events to all geographies
    var features = this.plot.selectAll(".feature")
        .on("mouseover", function (d) {
            d3.select(this).classed("active", true).moveToFront();
            _this.tooltip(d);
            _this.tooltipDiv.style('display', 'inherit');
        })
        .on("mouseout", function (d) {
            d3.select(this).classed("active", false);
            _this.tooltipDiv.style('display', 'none');
        })
        .on("mousemove", function () {

            //Get page offset position of map container
            //This tooltip positioning method should work across browsers
            var bodyRect = document.body.getBoundingClientRect(),
                elemRect = _this.element.getBoundingClientRect(),
                offsetTop = elemRect.top - bodyRect.top,
                offsetLeft = elemRect.left - bodyRect.left;

            //Mouse positions
            var xPos = d3.event.pageX - offsetLeft;
            var yPos = d3.event.pageY - offsetTop;

            //Tooltip dimensions
            var ttWidth = parseInt(_this.tooltipDiv.style("width").replace("px", ""), 10);
            var ttHeight = parseInt(_this.tooltipDiv.style("height").replace("px", ""), 10);

            //Tooltip positions
            var ttLeft = xPos - (ttWidth / 2);
            var ttTop = yPos - ttHeight - 30;

            //Some spacing logic to ensure tooltip doesn't get cut off by parent container
            var maxRight = _this.width - (ttWidth / 2);

            //If too far to the right
            if (ttLeft + (ttWidth / 2) >= maxRight) {
                ttLeft = maxRight - (ttWidth / 2);
            }

            //If too close to the top
            if (ttTop < 0) {
                ttTop = yPos + 30;
            }

            //If too far to the left
            if (ttLeft < 0) {
                ttLeft = 0;
            }

            _this.tooltipDiv.style({
                "top": ttTop + "px",
                "left": ttLeft + "px"
            });
        })
        .on("click", function (d) {
            var el = this;
            _this.clicked(d, el);
        });


}

electionMap.prototype.setColor = function (val) {
    if (!val) {
        return "blue";
    } else {
        return "red";
    }
}


electionMap.prototype.resetProjection = function () {

    //Multiplier to determine how map fits in container.
    projectionRatio = 1;

    this.path = d3.geo.path();

    this.projection = d3.geo.albersUsa()
        .scale(this.width * projectionRatio)
        .translate([this.width / 2, this.height / 2]);



    this.path.projection(this.projection);
}



electionMap.prototype.setDimensions = function () {
    // define width, height and margin
    this.width = this.element.offsetWidth;
    this.height = this.element.offsetWidth * .5; //Determine desired height here
    this.margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };
}




//Set view as "states", "counties"
electionMap.prototype.setView = function () {
    var states = this.plot.select(".states-g");
    var counties = this.plot.select(".counties-g");

    if (this.view === "states") {
        states.style("display", "inherit");
        counties.style("display", "none");
    } else if (this.view === "counties") {
        states.style("display", "none");
        counties.style("display", "inherit");
    }
}



/* ---------------------------------------- */
/* FIRE THIS FUNCTION TO UPDATE MAP DATA */
/* ---------------------------------------- */
electionMap.prototype.update = function (liveData) {

    /* ------------- */
    /* This model assumes data would be available as a dictionary object */
    /* in which results are looked up by geographic ID or FIPS values */
    /* Each feature in the selections below has a unique state, county, or district ID */
    /* So you'd use it to look up the corresponding result in each iteration */
    /* ------------- */

    //Set width/height/margins
    this.setDimensions();

    //Set the projection according to width/height
    //this.resetProjection();

    //Update svg dimensions
    this.svg.attr('width', this.width);
    this.svg.attr('height', this.height);

    var _this = this;

    this.plot.selectAll("path")
        .attr("d", _this.path);

    var states = this.plot.select(".states-g");
    var counties = this.plot.select(".counties-g");

    states.selectAll("path")
        .attr("fill", function (d) {            
            return "grey";
        });


    counties.selectAll("path")
        .attr("fill", function (d) {
            
            return "red";
        });



}


electionMap.prototype.homeButton = function () {
    /*****************************************
    MODIFIED: reset map to only show states when zoomed out
    *****************************************/
    var _this = this;

    d3.select(this.element).append("button")
        .attr("class", "home-btn")
        .html("Reset Map")
        .on("click", function () {
            //Recenter map
            _this.zoomScale(1, (_this.width) / 2, (_this.height / 2));


            _this.setView();
            d3.select(this).style("display", "none");

        })
}




//Zoom to center of selected feature when clicked
electionMap.prototype.clicked = function (d, el) {

    /*****************************************
        MODIFIED: show counties when zoomed in
    *****************************************/

    var x, y, k; //left, top, zoom

    var _this = this;

    var states = this.plot.select(".states-g");
    var counties = this.plot.select(".counties-g");


    if (d && _this.centered !== d) {

        var centroid = _this.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = _this.maxZoom;
        _this.centered = d;
        d3.select(el).classed("centered", true);
        _this.isZoomed = true;

        d3.select(".home-btn").style("display", "inherit");

    } else {
        x = _this.width / 2;
        y = _this.height / 2;
        k = 1;
        _this.centered = null;
        d3.select(el).classed("centered", false);
        _this.isZoomed = false;

        d3.select(".home-btn").style("display", "none");
    }

    var countyitems = [];
    var first2id = d.id.toString().slice(0, 2);
    countygeos.forEach(function (item) {
        if (item.id.toString().slice(0, 2) === first2id) {
            countyitems.push(item);

        }
    });
    // Remove all current counties
    counties.selectAll("path").remove();

    this.geo.objects.counties.geometries = countyitems;
    counties.selectAll("path")
        .data(topojson.feature(this.geo, this.geo.objects.counties).features)
        .enter().append("path")
        .attr("d", _this.path)
        .attr("class", "county feature")
        .attr("fill", function (d) {
            for (var i = 0; i < electiondata.length; i++) {
                if (d.id == electiondata[i].combined_fips) {
                    if (electiondata[i].votes_dem < electiondata[i].votes_gop) {
                        return "red";
                    } else {
                        return "blue";
                    }
                }
            }
        });

    counties.style("display", "inherit");
    states.style("display", "inherit");

    _this.plot.classed("zoomed", _this.isZoomed);
    _this.zoomScale(k, x, y);

}


//Set new scale and translate position and size strokes according to scale.
electionMap.prototype.zoomScale = function (k, x, y) {

    var _this = this;

    _this.plot.transition()
        .duration(750)
        .attr("transform", "translate(" + (_this.width / 2) + "," + (_this.height / 2) + ")scale(" + k + ")translate(" + -x + "," + -y + ")")

    _this.plot.selectAll(".feature")
        .style("stroke-width", (_this.lineStroke / k));

}




electionMap.prototype.tooltip = function (d) {

    var txt;

    if (this.view === "states") {
        txt = "State FIPS: " + d.id;
    } else if (this.view === "counties") {
        txt = "County FIPS: " + d.id;
    }

    d3.select(".tooltip").html(txt);

}

function init() {

    d3.json("election/static/js/us2016.topo.json", function (error, us) {
        if (error) throw error;


        // create new Map using Map constructor
        var theMap = new electionMap({
            element: document.querySelector('.map-target'),
            geo: us,
            view: "states"
        });

        //Set button toggle for view state
        d3.selectAll("input")
            .on("click", function () {
                theMap.view = d3.select(this).attr("val");
                theMap.setView();
            });

        // redraw Map on each resize
        d3.select(window).on('resize', function () {
            theMap.update();
        });

        for (var i = 0; i < electiondata.length; i++) {

            // changes json file so that every fips is 5 characters long
            if (electiondata[i].combined_fips < 10000) {
                electiondata[i].combined_fips = "0" + electiondata[i].combined_fips;
            }

            if (electiondata[i].votes_dem < electiondata[i].votes_gop) {
                colordata.push("Rep");
            } else if (electiondata[i].votes_dem > electiondata[i].votes_gop) {
                colordata.push("Dem");
            }
        }


    });
}

init();


/* HELPER FUNCTIONS */
//Move to front and back controls z-index of features on mouseover and mouseout.
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};