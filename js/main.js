var myMap = function() {

	var	options = {
		zoom: 6.3,
		center: new google.maps.LatLng(0.922183, 37.913444),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}

	/*
		Load the map then markers
		@param object settings (configuration options for map)
		@return undefined
	*/
	function init(settings) {
		map = new google.maps.Map(document.getElementById( settings.idSelector ), options);
		markerLocation = settings.markerLocation;
		loadMarkers();
	}

	/*
		=======
		MARKERS
		=======
	*/
	markers = {};
	markerList = [];

	/*
		Load markers onto the Google Map from a provided array or demo facilityData (data.js)
		@param array facilityList [optional] (list of facilities to load)
		@return undefined
	*/
	function loadMarkers(facilityList) {

		// optional argument of facility
		var facilities = ( typeof facilityList !== 'undefined' ) ? facilityList : facilityData;

		var j = 1; // for lorempixel

		for( i=0; i < facilities.length; i++ ) {
			var facility = facilities[i];
			// console.log(facility)
			// if its already on the map, dont put it there again
			if( markerList.indexOf(facility.id) !== -1 ) continue;
			if (facility.lat_long !==null){
			var lat = facility.lat_long[0],
				lng = facility.lat_long[1],
				markerId = facility.id;
			}
			var infoWindow = new google.maps.InfoWindow({
				maxWidth: 400
			});

			var marker = new google.maps.Marker({
				position: new google.maps.LatLng( lat, lng ),
				title: facility.county,
				markerId: markerId,
				icon: markerLocation,
				map: map
			});

			markers[markerId] = marker;
			markerList.push(facility.id);

			if( j > 10 ) j = 1; // for lorempixel, the thumbnail image
			var content = ['<div class="iw"><img src="http://lorempixel.com/90/90/abstract/',
				j, '" width="90" height="90">', '<div class="iw-text"><strong>', facility.name,
				'</strong><br>County: ', facility.county, '<br>keph_level: ', facility.keph_level_name,
				'<br>Owner: ', facility.owner_name, '</div></div>'].join('');
			j++; // lorempixel
			
			google.maps.event.addListener(marker, 'click', (function (marker, content) {
				return function() {
					infoWindow.setContent(content);
					infoWindow.open(map, marker);
				}
			})(marker, content));	
		}
	}

	/*
		Remove marker from map and our list of current markers
		@param int id (id of the marker element)
		@return undefined
	*/
	function removefacilityMarker(id) {
		if( markers[id] ) {
			markers[id].setMap(null);
			loc = markerList.indexOf(id);
			if (loc > -1) markerList.splice(loc, 1);
			delete markers[id];
		}
	}

	/*
		======
		FILTER
		======
	*/

	// default all filters off
	var filter = {
		keph_level_name: 0,
		county: 0,
		from: 0
	}
	var filterMap;

	/*
		Helper function
		@param array a (array of arrays)
		@return array (common elements from all arrays)
	*/
	function reduceArray(a) {
		r = a.shift().reduce(function(res, v) {
			if (res.indexOf(v) === -1 && a.every(function(a) {
				return a.indexOf(v) !== -1;
			})) res.push(v);
			return res;
		}, []);
		return r;
	}

	/*
		Helper function
		@param string n
		@return bool
	*/
	function isInt(n) {
	    return n % 1 === 0;
	}


	/*
		Decides which filter function to call and stacks all filters together
		@param string filterType (the property that will be filtered upon)
		@param string value (selected filter value)
		@return undefined
	*/
	function filterCtrl(filterType, value) {
		// result array
		var results = [];

		if( isInt(value) ) {
			filter[filterType] = parseInt(value);
		} else {
			filter[filterType] = value;
		}
		
		for( k in filter ) {
			if( !filter.hasOwnProperty(k) && !( filter[k] !== 0 ) ) {
				// all the filters are off
				loadMarkers();
				return false;
			} else if ( filter[k] !== 0 ) {
				// call filterMap function and append to r array
				results.push( filterMap[k]( filter[k] ) );
			} else {
				// fail silently
			}
		}

		if( filter[filterType] === 0 ) results.push( facilityData );
		
		/*
			if there is 1 array (1 filter applied) set it,
			else find markers that are common to every results array (pass every filter)
		*/
		if( results.length === 1 ) {
			results = results[0];
		} else {
			results = reduceArray( results );
		}
		
		loadMarkers( results );

	}
	
	/* 
		The keys in this need to be mapped 1-to-1 with the keys in the filter variable.
	*/
	filterMap = {
		keph_level_name: function( value ) {
			return filterByString('keph_level_name', value);
		},
		
		county: function( value ) {
			return filterByString('county_name', value);
		},

		from: function( value ) {
			return filterByString('from', value);
		}
	}

	/*
		Filters marker data based upon a string match
		@param string dataProperty (the key that will be filtered upon)
		@param string value (selected filter value)
		@return array (facilities that made it through the filter)
	*/
	function filterByString( dataProperty, value ) {
		var facilities = [];

		for( var i=0; i < facilityData.length; i++ ) {
	
			var facility = facilityData[i];
			// console.log("filtering by string"+ facility)
			if( facility[dataProperty] == value ) {
				facilities.push( facility );
			} else {
				removefacilityMarker( facility.id );
			}
		}
		return facilities;
	}

	/*
		Filters out integers that are under the provided value
		@param string dataProperty (the key that will be filtered upon)
		@param int value (selected filter value)
		@return array (facilities that made it through the filter)
	*/
	function filterIntsLessThan( dataProperty, value ) {
			var facilities = [];

			for( var i=0; i < facilityData.length; i++ ) {
				var facility = facilityData[i];
				if( facility[dataProperty] > value ) {
					facilities.push( facility )
				} else {
					removefacilityMarker( facility.id );
				}
			}
			return facilities;
	}

	// Takes all the filters off
	function resetFilter() {
		filter = {
			keph_level_name: 0,
			county: 0,
			from: 0
		}
	}

	return {
		init: init,
		loadMarkers: loadMarkers,
		filterCtrl: filterCtrl,
		resetFilter: resetFilter
	};
}();


$(function() {

	var mapConfig = {
		idSelector: 'map-canvas',
		markerLocation: 'img/red-fat-marker.png'
	}

	myMap.init( mapConfig );

	$('.load-btn').on('click', function() {
		var $this = $(this);
		// reset everything
		$('select').val(0);
		myMap.resetFilter();
		myMap.loadMarkers();

		if( $this.hasClass('is-success') ) {
			$this.removeClass('is-success').addClass('is-default');
		}
	});

	$('.keph_level_name-select').on('change', function() {
		myMap.filterCtrl('keph_level_name', this.value);
	});

	$('.county-select').on('change', function() {
		myMap.filterCtrl('county', this.value);
	});

	$('.from-select').on('change', function() {
		myMap.filterCtrl('from', this.value);
	});
});





