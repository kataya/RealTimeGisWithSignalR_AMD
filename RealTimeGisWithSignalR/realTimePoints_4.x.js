// JS API 4.x

var map, tb;
var realTimePoints;
var layersColors = [];

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "dojo/domReady!"
], function (Map, MapView, SketchViewModel, Graphic, GraphicsLayer, Ready) {
    var map = new Map({
        basemap: "streets"
    });

    var view = new MapView({
        container: "viewDiv",  // Reference to the DOM node that will contain the view
        map: map,               // References the map object created in step 3        
        center: [-25.312, 34.307],
        zoom: 3
    });


    var tempGraphicsLayer = new GraphicsLayer();
    map.add(tempGraphicsLayer);

    view.when(function () {
        // create a new sketch view model
        var sketchViewModel = new SketchViewModel({
            view: view,
            layer: tempGraphicsLayer,
            pointSymbol: { // symbol used for points
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                style: "square",
                color: "#8A2BE2",
                size: "16px",
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [255, 255, 255],
                    width: 3 // points
                }
            },
            polylineSymbol: { // symbol used for polylines
                type: "simple-line", // autocasts as new SimpleMarkerSymbol()
                color: "#8A2BE2",
                width: "4",
                style: "dash"
            },
            polygonSymbol: { // symbol used for polygons
                type: "simple-fill", // autocasts as new SimpleMarkerSymbol()
                color: "rgba(138,43,226, 0.8)",
                style: "solid",
                outline: {
                    color: "white",
                    width: 1
                }
            }
        });
        // ************************************************************
        // Get the completed graphic from the event and add it to view.
        // This event fires when user presses
        //  * "C" key to finish sketching point, polygon or polyline.
        //  * Double-clicks to finish sketching polyline or polygon.
        //  * Clicks to finish sketching a point geometry.
        // ***********************************************************
        sketchViewModel.on("draw-complete", function (evt) {
            // if multipoint geometry is created, then change the symbol
            // for the graphic
            if (evt.geometry.type === "multipoint") {
                evt.graphic.symbol = {
                    type: "simple-marker",
                    style: "square",
                    color: "green",
                    size: "16px",
                    outline: {
                        color: [255, 255, 255],
                        width: 3
                    }
                };
            }
            // add the graphic to the graphics layer
            tempGraphicsLayer.add(evt.graphic);
            setActiveButton();
        });

        // *************************************
        // activate the sketch to create a point
        // *************************************
        var drawPointButton = document.getElementById("pointButton");
        drawPointButton.onclick = function () {
            // set the sketch to create a point geometry
            sketchViewModel.create("point");
            setActiveButton(this);
        };

        // ******************************************
        // activate the sketch to create a multipoint
        // ******************************************
        var drawMultipointButton = document.getElementById(
          "multipointButton");
        drawMultipointButton.onclick = function () {
            // set the sketch to create a multipoint geometry
            sketchViewModel.create("multipoint");
            setActiveButton(this);
        };

        // ****************************************
        // activate the sketch to create a polyline
        // ****************************************
        var drawLineButton = document.getElementById("polylineButton");
        drawLineButton.onclick = function () {
            // set the sketch to create a polyline geometry
            sketchViewModel.create("polyline");
            setActiveButton(this);
        };

        // ***************************************
        // activate the sketch to create a polygon
        // ***************************************
        var drawPolygonButton = document.getElementById("polygonButton");
        drawPolygonButton.onclick = function () {
            // set the sketch to create a polygon geometry
            sketchViewModel.create("polygon");
            setActiveButton(this);
        };

        function setActiveButton(selectedButton) {
            // focus the view to activate keyboard shortcuts for sketching
            view.focus();
            var elements = document.getElementsByClassName("active");
            for (var i = 0; i < elements.length; i++) {
                elements[i].classList.remove("active");
            }
            if (selectedButton) {
                selectedButton.classList.add("active");
            }
        }

    })

    var ready = $(function () {

            // Create Proxy to SignalR hub
            realTimePoints = $.connection.realTimePoints;

            // This function is callable from the server
            realTimePoints.client.addPoint = function addPoint(cid, x, y) {

                // Create point object and set its geometry
                var p = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 102100 }));

                // Get the layer of remote user to which the line will be added
                var gLayer = map.getLayer(cid);

                // Set up symbol and color of point
                // Get color from the layersColors list
                var symbol = new esri.symbol.SimpleMarkerSymbol();
                var clr = layersColors[layersColors.indexOf(cid) + 1];
                symbol.setColor(new dojo.Color(clr));

                // Add point to graphics layer
                gLayer.add(new esri.Graphic(p, symbol));
            };

            // This function is callable from the server
            realTimePoints.client.addPolyline = function addPolyline(cid, paths) {

                // Create line object and set its geometry
                var line = new esri.geometry.Polyline(new esri.SpatialReference({ wkid: 102100 }));
                line.paths = paths;

                // Get the layer of remote user to which the line will be added
                var gLayer = map.getLayer(cid);

                // Set up symbol and color of line
                // Get color from the layersColors list
                var symbol = new esri.symbol.SimpleLineSymbol();
                var clr = layersColors[layersColors.indexOf(cid) + 1];
                symbol.setColor(new dojo.Color(clr));

                // Add line to graphics layer
                gLayer.add(new esri.Graphic(line, symbol));
            };

            // This function is callable from the server
            realTimePoints.client.addPolygon = function addPolygon(cid, rings) {

                // Create polygon object and set its geometry
                var polygon = new esri.geometry.Polygon(new esri.SpatialReference({ wkid: 102100 }));
                polygon.rings = rings;

                // Get the layer of remote user to which the polygon will be added
                var gLayer = map.getLayer(cid);

                // Set up symbol and color of polygon
                // Get color from the layersColors list
                var symbol = new esri.symbol.SimpleFillSymbol();
                var clr = layersColors[layersColors.indexOf(cid) + 1];
                symbol.setColor(new dojo.Color(clr));

                // Add polygon to graphics layer
                gLayer.add(new esri.Graphic(polygon, symbol));
            };

            // This function is callable from the server
            realTimePoints.client.addLayer = function addLayer(cid, color) {

                // Create new layer
                var gLayer = new esri.layers.GraphicsLayer();
                gLayer.id = cid;

                // Keep track of layer names and their colors.
                layersColors.push(cid);
                layersColors.push(color);

                // Add layer
                map.addLayer(gLayer);

                // Update number of layers counter
                $("#graphicsLayersCount").empty();
                $("#graphicsLayersCount").append("<p>Number of graphics layers: " + map.graphicsLayerIds.length + "</p>");

                // Set the default symbols for drawing
                if ($.connection.hub.id === cid) {

                    var clr = layersColors[layersColors.indexOf(cid) + 1];

                    // Point symbol
                    var symbol = new esri.symbol.SimpleMarkerSymbol();
                    symbol.setColor(new dojo.Color(clr));
                    tb.markerSymbol = symbol;

                    // Line symbol
                    symbol = new esri.symbol.SimpleLineSymbol();
                    symbol.setColor(new dojo.Color(clr));
                    tb.lineSymbol = symbol;
                }
            };

            // This function is callable from the server
            realTimePoints.client.removeLayer = function removeLayer(cid) {

                if ($.connection.hub.id !== cid) {

                    // Get layer with specific cid (Connection ID)
                    var gLayer = map.getLayer(cid);

                    // Remove layer
                    map.removeLayer(gLayer);

                    // Update number of layers counter
                    $("#graphicsLayersCount").empty();
                    $("#graphicsLayersCount").append("<p>Number of graphics layers: " + map.graphicsLayerIds.length + "</p>");
                }
            };

            // This function is callable from the server
            realTimePoints.client.updataGraphicsLayersLegend =
                function updataGraphicsLayersLegend(layersNames, layersColors) {

                    // This function updates the legend

                    $("#legendDiv").empty();
                    $("#legendDiv").append("<p><b>Legend</b></p>");

                    for (var i = 0; i < layersNames.length; i++) {

                        $("#legendDiv").append("<p><font color='" + layersColors[i] + "'>" + layersNames[i] + "</font></p>");
                    }
                };

            // This function is callable from the server
            realTimePoints.client.updateOwnUserName = function updateOwnUserName(initialUserName) {
                // This function sets the user's initial username which is assigned by the server.
                $("#txtUserName").val(initialUserName);
            };

            // Everything is ready, now start the connection
            $.connection.hub.start();

    })


});


function btnUpdateUserName_Click() {
    realTimePoints.server.updateUserName($("#txtUserName").val());
}

