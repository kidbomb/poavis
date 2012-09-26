
		//does not work as a property; why is that?
		var nearest_bus_stops =  new Array();
		//creating layers by hands is lees error- prone
		//weird behavior with geometries and inverted latlng

		FusionTablesConfig = function()
		{
			this.url = "https://www.googleapis.com/fusiontables/v1/query?sql=";
			this.key = "AIzaSyDzCqo28pFaXthYWbHulJWwg08416pd_xQ";
		}
	
		LineService = function()
		{
			this.config = new FusionTablesConfig();
			this.table_lines = "1xpwaOFpqrsLmx25Rp8s2sbEcpAvqfS6E5xxgjM0";
		}
		LineService.prototype.getLines = function(callback)
		{
			$.getJSON(this.config.url
					+'SELECT linha_id, onibus_id, nome,sentido'
					+' FROM ' + this.table_lines
					+"&key="+this.config.key, callback);
		}
		
		LineService.prototype.getLineGeometry = function(line_id, callback)
		{
			$.getJSON(this.config.url
					+'SELECT geometria'
					+' FROM ' + this.table_lines
					+' WHERE linha_id = '+line_id
					+"&key="+this.config.key, callback); 
		}
		
		LineService.prototype.getLinesFromBusStop = function(busstop_id, callback)
		{
			$.getJSON(this.config.url
					+'SELECT linha_id, nome'
					+' FROM 1ERIPOqXOkXBXw97RdmnNRSrTEoXQOdPEoiOylSE' //parada_linha_merge
					+' WHERE parada_id = '+busstop_id
					+"&key="+this.config.key, callback); 
		}
		

		BusStopService = function()
		{
			this.config = new FusionTablesConfig();
		}
		

		BusStopService.prototype.getNearestBusStops = function(latlng, radius, callback)
		{
				$.getJSON(this.config.url
					+'SELECT lat_lng,parada_id'
					+' FROM 1XnA2xxuAz9VwwwAJUBJU9QyNQyg4xnFLRZuFWUk' //paradas
					+' WHERE ST_INTERSECTS(lat_lng, CIRCLE(LATLNG('+latlng.lat()+','+ latlng.lng() +'),'+ radius +'))'
					+"&key="+this.config.key, callback); 

		}

		BusStopList = function()
		{
		}

		BusStopList.prototype.createRow = function(line)
		{
				var new_row = '<tr>'
                        	+ '<td style="background-color:#EEE; border:1px solid #CCC">'
                            + '<table style="width:280px">'
                            	+'<tr>'
                                	+'<td>'
                                    + line.name
                                    +'</td>'
									+'<td style="background-color:'+line.color
									+';border:1px solid #CCCCCC;cursor:pointer;width:20px;" id="line_'+ line.line_id +'">'
                                    +'<div id="colorpicker_'+line.line_id+'"&nbsp;</div>'
                                    +'</td>'
                                +'</tr>'
                            +'</table>'
                            +'</td>'
                    	+'</tr>';
					
				$("#linhasTable > tbody:last").append(new_row);
				$("#line_"+line.line_id).click(this.onRowClicked);

				$('#colorpicker_'+line.line_id).ColorPicker({
					flat: true,
					color: line.color,
					onSubmit: function(hsb, hex, rgb) {
						line.path.setOptions({strokeColor:"#" + hex});
						$('#colorpicker_'+line.line_id+'>div').hide();
						$('#line_'+line.line_id).css('background-color', '#' + hex);
					}
				});
				$('#colorpicker_'+line.line_id+'>div').css('position', 'absolute');
				$('#colorpicker_'+line.line_id+'>div').css('z-index', '2');
				$('#colorpicker_'+line.line_id+'>div').hide();
		}

		BusStopList.prototype.onRowClicked = function()
		{
			line_id = $(this).attr('id').substr(5);
			$('#colorpicker_'+line_id+'>div').show();
		}
		

		Line = function()
		{
			this.line_id = "";
			this.name = "";
			this.sentido = "";
			this.path = null;
			this.color = "";
			this.service = new LineService();
		}
		
		Line.prototype.draw = function(map_canvas){
			var coordinates = new google.maps.MVCArray();
			
			this.service.getLineGeometry(line_id, function(data){
   				var latlngbounds = new google.maps.LatLngBounds();
				
				var points = data.rows[0][0];
				$.each(points.geometry.coordinates, function(i,point){
   					var coordinate = new google.maps.LatLng(point[1], point[0]);
					coordinates.push(coordinate);
					latlngbounds.extend(coordinate);
   				});
				
   				map_canvas.fitBounds(latlngbounds);
				
				this.path = new google.maps.Polyline({
   					path: coordinates,
		   	   		strokeColor: this.color,
   	   				strokeOpacity: 0.7,
		   	   		strokeWeight: 3
		   		});

				this.path.setMap(map_canvas);

			}.bind(this));
		}

		function BusStop(busstop_id,coordinate, map_canvas)
		{
			this.busstop_id = busstop_id;
			this.marker = new google.maps.Marker({
				position: coordinate,
				icon:  "http://storage.googleapis.com/support-kms-prod/SNP_2752125_en_v0",
				map: map_canvas
			});
			this.map_canvas = map_canvas;
			google.maps.event.addListener(this.marker, 'click', this.onBusStopClicked.bind(this));
		}

		BusStop.prototype.onBusStopClicked = function(e){
			service = new LineService(); //TODO: recreate every time??
			service.getLinesFromBusStop(this.busstop_id,  function(data) {
					infoWindowLinha = new google.maps.InfoWindow();


					infoContentDiv =  document.createElement('div');
					infoContentJ = $(infoContentDiv);
					infoContentJ.append("Linhas dessa parada:");
					infoContentJ.append("<br>");
					$.each(data.rows, function(index, row){
						infoContentJ.append("<br>");
						infoContentJ.append(row[1]);

						infoContentJ.append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
						infoContextAddLineLink = $("<a href='#'>[adicionar]</a>");
						infoContextAddLineLink.click(function(){
							console.log(row[0]);
						}.bind(this));
						infoContentJ.append(infoContextAddLineLink);
						//
					}.bind(this));
					infoContentJ.append("<br><br>");


					infoContextLink = $("<a href='#'>[Salvar esta parada]</a>");
					infoContextLink.click(function(){
							console.log(this.busstop_id);
					}.bind(this));
					infoContentJ.append(infoContextLink);

					infoWindowLinha.setOptions({
						content: infoContentDiv,
						position: e.latLng,
						pixelOffset: e.pixelOffset
					});
					infoWindowLinha.open(this.map_canvas);

			}.bind(this));
		}


		
		function PoaVisMain()
		{
			this.lines_cache = {};
			this.lines = {};
			this.available_colors = ['#FF0000', '#00FF00', '#0000FF'];
			this.next_available_color = 0;
			this.service = new LineService();
			this.bus_stop_service = new BusStopService();
			this.bus_stop_list = new BusStopList();
		}
		
		PoaVisMain.prototype.initializeMap = function(){
			$('#map-canvas').gmap({'center':'-30.13206313822174,-51.107025146484375', 'zoom':11});
			$('#map-canvas').gmap().bind('init', function(ev, map) {
			});
			
			this.map_canvas = $('#map-canvas').gmap('get', 'map'); 
		}

		PoaVisMain.prototype.initializeMapListeners = function(){
			google.maps.event.addListener(this.map_canvas, 'zoom_changed', this.onMapZoomChanged.bind(this));
		}
		
		
		PoaVisMain.prototype.getNextAvailableColor = function(){
			if(this.next_available_color >= this.available_colors.length){
				this.next_available_color = 0;
			}
			next_color = this.available_colors[this.next_available_color++];
			return next_color;
		}
		
		
		PoaVisMain.prototype.cacheLines = function(){
			this.service.getLines(function(data) {
				$.each(data.rows, function(index, value){
					line_id = value[0];
					name = value[2];
					sentido = value[3];

					this.lines_cache[line_id] = new Line();
					this.lines_cache[line_id].name = name;
					this.lines_cache[line_id].sentido = sentido;
				}.bind(this));
			}.bind(this));
		}
		
		PoaVisMain.prototype.setupPlacesAutocomplete = function(){
			var input = document.getElementById('searchTextField');
			var marker = new google.maps.Marker({
          		map: this.map_canvas
			});

	        var autocomplete = new google.maps.places.Autocomplete(input);
    	    autocomplete.bindTo('bounds', this.map_canvas);

        	google.maps.event.addListener(autocomplete, 'place_changed', function() {
  				this.onMapPlaceChanged(autocomplete, marker);
			}.bind(this));
		}

		PoaVisMain.prototype.onMapPlaceChanged = function(autocomplete, marker)	{
         	var place = autocomplete.getPlace();
          	if (place.geometry.viewport) {
           		this.map_canvas.fitBounds(place.geometry.viewport);
	        } else {
    	       	this.map_canvas.setCenter(place.geometry.location);
        	    this.map_canvas.setZoom(16);  // Why 16? Because it looks good.
          	}

	        marker.setPosition(place.geometry.location);

    	   	var address = '';
         	if (place.address_components) {
           		address = [
         	  		(place.address_components[0] && place.address_components[0].short_name || ''),
	        	   	(place.address_components[1] && place.address_components[1].short_name || ''),
            		(place.address_components[2] && place.address_components[2].short_name || '')
     	    	].join(' ');
			}
		}
		
		PoaVisMain.prototype.setupLinesAutocomplete = function(){
			$( "#linhas" ).autocomplete({   
				source:  function(request, response) {
					var ac_response = []
					$.each(this.lines_cache, function(line_id, line){
							if(request.term.length >=2 && line.name.toLowerCase().indexOf(request.term.toLowerCase()) != -1){
								text = line.name + " - Sentido " + line.sentido;
								ac_response.push({label:text, value:"", id:line_id});
							}		
					});
					response(ac_response);
				}.bind(this),
				select: function( event, ui ) {
					this.addLine(ui.item.id)
					//TODO: 
					//status when loading line
				}.bind(this)		
			});
		}

		PoaVisMain.prototype.addLine = function(line_id){
				this.lines[line_id] = new Line();
				this.lines[line_id].color = this.getNextAvailableColor();
				this.lines[line_id].line_id = line_id;
				this.lines[line_id].name = this.lines_cache[line_id].name;
				this.lines[line_id].sentido = this.lines_cache[line_id].sentido;
				this.lines[line_id].draw(this.map_canvas);

				this.bus_stop_list.createRow(this.lines[line_id]);
		}
			
		
		
		PoaVisMain.prototype.getNearestBusStops = function (latlng){
			this.bus_stop_service.getNearestBusStops(latlng, 500, function(data){
				$.each(data.rows, function(i,row){
					point=row[0].split(",");
					busstop_id = row[1];					
					nearest_bus_stops.push(new BusStop(busstop_id,new google.maps.LatLng(point[0], point[1]), this.map_canvas));
				}.bind(this));
			}.bind(this));
		}

		PoaVisMain.prototype.clearNearestBusStops = function(){
			for(i in nearest_bus_stops)
			{
				nearest_bus_stops[i].marker.setMap(null);
				//TODO:remove from dictionary
			}
			nearest_bus_stops = new Array();


		}

		PoaVisMain.prototype.onMapZoomChanged = function(event){
			if(this.map_canvas.getZoom() > 14){
				this.getNearestBusStops(this.map_canvas.getCenter());
			} else {
				this.clearNearestBusStops();
			}
		}
