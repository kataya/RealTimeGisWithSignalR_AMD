// JS API 3.x AMD

var map, tb;
var realTimePoints;
var layersColors = [];

require([
    "esri/map",
    "esri/toolbars/draw",
    "esri/graphic",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    "esri/geometry/Geometry", "esri/SpatialReference",

    "dojo/parser", "dijit/registry", "dojo/_base/Color",
    "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dijit/form/Button", "dijit/WidgetSet",

    "dojo/domReady!"
], function (
    Map, Draw, Graphic,
    Geometry, SpatialReference,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    parser, registry, Color
) {
    parser.parse();

    map = new Map("map", {
        basemap: "streets",
        center: [-25.312, 34.307],
        zoom: 3
    });


    map.on("load", createToolbar);

    registry.forEach(function (d) {
        // d is a reference to a dijit
        // could be a layout container or a button
        if (d.declaredClass === "dijit.form.Button") {
            if (d.id != "deactivateBtn") {
                d.on("click", activateTool);
            }    
        }

    });

    function activateTool() {
        var tool = this.label.toUpperCase().replace(/ /g, "_");
        tb.activate(Draw[tool]);
        map.hideZoomSlider();
    }

    function createToolbar(themap) {
        tb = new Draw(map);
        tb.on("draw-complete", addGraphic);
    }

    function addGraphic(evt) {

        //tb.deactivate();
        map.hideZoomSlider();

        //map.enableMapNavigation();

        var symbol;
        if (evt.geometry.type === "point" || evt.geometry.type === "multipoint") {
            var symbol = new esri.symbol.SimpleMarkerSymbol();
            var clr = layersColors[layersColors.indexOf($.connection.hub.id) + 1];
            symbol.setColor(new dojo.Color(clr));
            //Notify the server about the point
            realTimePoints.server.addPoint(evt.geometry.x, evt.geometry.y);
        }
        else if (evt.geometry.type === "line" || evt.geometry.type === "polyline") {
            var symbol = new esri.symbol.SimpleLineSymbol();
            var clr = layersColors[layersColors.indexOf($.connection.hub.id) + 1];
            symbol.setColor(new dojo.Color(clr));
            //Notify the server about the line
            realTimePoints.server.addPolyline(evt.geometry.paths);
        }
        else if (evt.geometry.type === "polygon") {
            var symbol = new esri.symbol.SimpleFillSymbol();
            var clr = layersColors[layersColors.indexOf($.connection.hub.id) + 1];
            symbol.setColor(new dojo.Color(clr));
            //Notify the server about the line
            realTimePoints.server.addPolygon(evt.geometry.rings);
        }
        else {
            symbol = tb.fillSymbol;
        }

        map.showZoomSlider();
    }


    $(function () {

        //Create Proxy to SignalR hub
        realTimePoints = $.connection.realTimePoints;

        //This function is callable from the server
        realTimePoints.client.addPoint = function addPoint(cid, x, y) {

            //Create point object and set its geometry
            var p = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 102100 }));

            //Get the layer of remote user to which the line will be added
            var gLayer = map.getLayer(cid);

            //Set up symbol and color of point
            //Get color from the layersColors list
            var symbol = new esri.symbol.SimpleMarkerSymbol();
            var clr = layersColors[layersColors.indexOf(cid) + 1];
            symbol.setColor(new dojo.Color(clr));

            //Add point to graphics layer
            gLayer.add(new esri.Graphic(p, symbol));
        };

        //This function is callable from the server
        realTimePoints.client.addPolyline = function addPolyline(cid, paths) {

            //Create line object and set its geometry
            var line = new esri.geometry.Polyline(new esri.SpatialReference({ wkid: 102100 }));
            line.paths = paths;

            //Get the layer of remote user to which the line will be added
            var gLayer = map.getLayer(cid);

            //Set up symbol and color of line
            //Get color from the layersColors list
            var symbol = new esri.symbol.SimpleLineSymbol();
            var clr = layersColors[layersColors.indexOf(cid) + 1];
            symbol.setColor(new dojo.Color(clr));

            //Add line to graphics layer
            gLayer.add(new esri.Graphic(line, symbol));
        };

        //This function is callable from the server
        realTimePoints.client.addPolygon = function addPolygon(cid, rings) {

            //Create polygon object and set its geometry
            var polygon = new esri.geometry.Polygon(new esri.SpatialReference({ wkid: 102100 }));
            polygon.rings = rings;

            //Get the layer of remote user to which the polygon will be added
            var gLayer = map.getLayer(cid);

            //Set up symbol and color of polygon
            //Get color from the layersColors list
            var symbol = new esri.symbol.SimpleFillSymbol();
            var clr = layersColors[layersColors.indexOf(cid) + 1];
            symbol.setColor(new dojo.Color(clr));

            //Add polygon to graphics layer
            gLayer.add(new esri.Graphic(polygon, symbol));
        };

        //This function is callable from the server
        realTimePoints.client.addLayer = function addLayer(cid, color) {

            //Create new layer
            var gLayer = new esri.layers.GraphicsLayer();
            gLayer.id = cid;

            //Keep track of layer names and their colors.
            layersColors.push(cid);
            layersColors.push(color);

            //Add layer
            map.addLayer(gLayer);

            //Update number of layers counter
            $("#graphicsLayersCount").empty();
            $("#graphicsLayersCount").append("<p>Number of graphics layers: " + map.graphicsLayerIds.length + "</p>");

            //Set the default symbols for drawing
            if ($.connection.hub.id === cid) {

                var clr = layersColors[layersColors.indexOf(cid) + 1];

                //Point symbol
                var symbol = new esri.symbol.SimpleMarkerSymbol();
                symbol.setColor(new dojo.Color(clr));
                tb.markerSymbol = symbol;

                //Line symbol
                symbol = new esri.symbol.SimpleLineSymbol();
                symbol.setColor(new dojo.Color(clr));
                tb.lineSymbol = symbol;
            }
        };

        //This function is callable from the server
        realTimePoints.client.removeLayer = function removeLayer(cid) {

            if ($.connection.hub.id !== cid) {

                //Get layer with specific cid (Connection ID)
                var gLayer = map.getLayer(cid);

                //Remove layer
                map.removeLayer(gLayer);

                //Update number of layers counter
                $("#graphicsLayersCount").empty();
                $("#graphicsLayersCount").append("<p>Number of graphics layers: " + map.graphicsLayerIds.length + "</p>");
            }
        };

        //This function is callable from the server
        realTimePoints.client.updataGraphicsLayersLegend =
            function updataGraphicsLayersLegend(layersNames, layersColors) {

                //This function updates the legend

                $("#legendDiv").empty();
                $("#legendDiv").append("<p><b>Legend</b></p>");

                for (var i = 0; i < layersNames.length; i++) {

                    $("#legendDiv").append("<p><font color='" + layersColors[i] + "'>" + layersNames[i] + "</font></p>");
                }
            };

        //This function is callable from the server
        realTimePoints.client.updateOwnUserName = function updateOwnUserName(initialUserName) {
            //This function sets the user's initial username which is assigned by the server.
            $("#txtUserName").val(initialUserName);
        };
        

        //Everything is ready, now start the connection
        $.connection.hub.start();
    })

});

function btnUpdateUserName_Click() {
    realTimePoints.server.updateUserName($("#txtUserName").val());
}


