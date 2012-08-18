(function($){

	/**
	*	Application related information/variables
	*/
	
	// configures the rooms
	var ROOMS = ['Movie Room','TV Lounge', 'Party Room', 'XBox'];

	// defines the path to the php-file that handles the data requests (load_function.php in the plug-in directory)
	var REQUEST_URL = "/github/wordpress/wp-content/plugins/multimedia_booking/load_function.php";
	
	// will be used to store the bookings of a month within the application
	var BOOKINGS = {};

	// string names of months
	var MONTHS = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	// number of days in a month
	var CURRENTDAYS;
	var CURRENTMONTH;
	var CURRENTYEAR;


	$(document).ready(function(){

		// creates a jQuery UI datepicker
		$("#dateField").datepicker({dateFormat: "dd-mm-yy"});

		// sets the date variables to the current values
		var today = new Date();
		CURRENTMONTH = today.getMonth();
		CURRENTYEAR = today.getFullYear();
		CURRENTDAYS = getDaysPerMonth(CURRENTMONTH, CURRENTYEAR);

		// sets the rooms in the appropriate select fields
		for(var i=0; i<ROOMS.length; i++){
			$("#roomSelect").append("<option>" + ROOMS[i] + "</option>");
			$("#roomField").append("<option>" + ROOMS[i] + "</option>");
		}

		// fills the select fields for the start time field
		for(var i=0; i<24; i++){
			$("#timeHour").append("<option>" + i + "</option>");}
		for(var i=0; i<=45; i+=15){
			$("#timeMinute").append("<option>" + i + "</option>");
		}

		// fills the select fields for the duration field
		fillDurationSlots(true, true);

		// sets event listeners
		$("#durationHour").change(updateDurations);
		$("#day1_more").click(function(){$(".day1").each(function(){$(this).toggle("slow");});});
		$("#overlayBooking").bind('show', function(){prepareOverlay();});
		$("#openbooking").click(function(){$("#saveChanges").attr("data-bookingId", "-1"); $("#overlayBooking").modal('show')});
		$("#roomSelect").change(hideBookings);
		$("#saveChanges").click(function(){updateBooking();});
		$("#deleteBookingButton").click(function(){deleteBooking();});
		$(".prevMonth").click(showPrevMonth);
		$(".nextMonth").click(showNextMonth);
		$(window.parent).bind('hashchange', handleHashChange);

		// update the location hash to fetch the current events
		updateLocationHash();

	});

	/**
	*	Triggers the sizeFrameChanged event of the parent window object which 
	* 	makes the iframe fit to the current size of the application
	*/
	function updateFrameSize(){
		parent.$(window.parent).trigger("sizeFrameChanged");
	};

	function updateLocationHash(){
		window.parent.location.hash = "!/"+CURRENTYEAR.toString()+"/"+(CURRENTMONTH+1).toString();
	}

	/**
	*	
	*
	*/
	function handleHashChange(){
		var newHash = window.parent.location.hash;
		if(newHash != ""){
			console.error(newHash);
			var newYear = newHash.substring(newHash.indexOf("/")+1, newHash.lastIndexOf("/"));
			console.error(newYear);
			var newMonth = newHash.substring(newHash.lastIndexOf("/")+1);
			console.error(newMonth);

			CURRENTMONTH = parseFloat(newMonth)-1;
			CURRENTYEAR = parseFloat(newYear);

			$(".monthheadline").html(MONTHS[CURRENTMONTH] + " " + CURRENTYEAR);

			fetchEventsMonth();
			updateFrameSize();
		}
	};

	/**
	*	Sets the minute-select of the duration field to 0 if the hours are chosen as 4 (max)
	*/
	function updateDurations(){
		$("#durationHour option:selected").each(function(){
			if($(this).text() == '4'){
				$("#durationMinute").html("<option selected>0</option>");
			} else {
				fillDurationSlots(false, true);
			}
		});
	};

	/**
	*	fills the select fields of the duration field
	* 	@params hour {Boolean} should the hour select be reset
	* 	@params minute {Boolean} should the minute select be reset
	*/
	function fillDurationSlots(hour, minute){
		var html = "";

		if(hour){
			for(var i=0; i<=4; i++){
				html += "<option>" + i + "</option>";
			}
			$("#durationHour").html(html);
		}

		if(minute){
			html = "";
			for(var i=0; i<=50; i+=10){
				html += "<option>" + i + "</option>";
			}
			$("#durationMinute").html(html);
		}
	};

	/**
	*	helper method to get the amount of dates in a certain month
	* 	@params month {Integer}
	* 	@params year {Integer}
	*/ 
	function getDaysPerMonth(month, year){
		return new Date(year, month, 0).getDate();
	};

	/**
	*	shows the events of the month previous to the currently displayed month
	*/ 
	function showPrevMonth(){
		CURRENTMONTH--;
		if (CURRENTMONTH <= 0) {
			CURRENTYEAR--;
			CURRENTMONTH += 12;
		}

		CURRENTDAYS = getDaysPerMonth(CURRENTMONTH, CURRENTYEAR);

		/*$(".monthheadline").html(MONTHS[CURRENTMONTH] + " " + CURRENTYEAR);

		fetchEventsMonth();
		updateFrameSize();*/
		updateLocationHash();
	};

	/**
	*	shows the events of the month after the currently displayed month
	*/
	function showNextMonth(){
		CURRENTMONTH++;
		if (CURRENTMONTH >= 12) {
			CURRENTYEAR++;
			CURRENTMONTH -= 12;
		}

		CURRENTDAYS = getDaysPerMonth(CURRENTMONTH, CURRENTYEAR);

		/*$(".monthheadline").html(MONTHS[CURRENTMONTH] + " " + CURRENTYEAR);

		fetchEventsMonth();
		updateFrameSize();*/
		updateLocationHash();
	};

	/**
	*	hides all bookings that are currently not chosen in the roomSelect field
	*/ 
	function hideBookings(){
		var chosenRoom = $("select#roomSelect").val()

		switch(chosenRoom){
    		case "Movie Room":
				$(".info").hide();
    			$(".room_Movie").show();
    			break;
    		case "TV Lounge":
    			$(".info").hide();
				$(".room_TV").show();
    			break;
			case "Party Room":
				$(".info").hide();
				$(".room_Party").show();
				break;
			case "XBox":
				$(".info").hide();
				$(".room_XBox").show();
				break;
			default:
				$(".info").show();
				break;
    	}

    	updateFrameSize();
	};

	/**
	*	fetches the events of the current month
	*/ 
	function fetchEventsMonth(){
		$.post(REQUEST_URL + '?function=getMonthEvents', {'month': MONTHS[CURRENTMONTH], 'year': CURRENTYEAR}, displayEventsMonth);
	};

	/**
	*	event callback of the fetchEventsMonth
	* 	uses the respond to create a list of all events in the current month
	*/
	function displayEventsMonth(dataStr){
		BOOKINGS.data = JSON.parse(dataStr);

		if(BOOKINGS.data == "No bookings for this month"){
			BOOKINGS.data = [];
		}

		var data = BOOKINGS.data;

		var $tbody = $("#calendar table tbody");
		var tableRow = "";
		var room = "";

		var endOfEvents = false;
		var writeDate = true;
		var day = 1;
		var nextEvent = 0;
		var idx = 0;

		var writtenDates = new Array(CURRENTDAYS);

		while(true){

			if(idx >= data.length){
				while(day <= CURRENTDAYS){
					tableRow += "<tr>" +
                                "<td id=>"+ day + ".</td>" + 
                                "<td colspan=\"4\" class=\"datetag\"><a id=\"day" + day +"_more\" href=\"javascript:void(0);\"></a></td>"+
                          		"</tr>";
                    day++;	
				}
				break;
			} else {
				nextEvent = parseFloat(data[idx].date.substring(0,2));
				if(day == nextEvent){
					if(!writtenDates[(day-1)]){
						tableRow += "<tr>" +
	                                "<td id=>"+ day + ".</td>" + 
	                                "<td colspan=\"4\" class=\"datetag\"><a id=\"day" + day +"_more\" href=\"javascript:void(0);\"></a></td>"+
	                          		"</tr>";
	                    writtenDates[(day-1)] = 1;
					}
					
					switch(data[idx].room){
	            		case "Movie Room":
	            			room = "Movie";
	            			break;
	            		case "TV Lounge":
	            			room = "TV";
	            			break;
	        			case "Party Room":
	        				room = "Party";
	        				break;
	    				case "XBox":
	    					room = "XBox";
	    					break;
	    				default:
	    					room = "";
	    					break;
	            	}

	            	var duration = parseFloat(data[idx].duration);
	            	var min = (Math.floor((duration % 3600) / 60));
	            	var hour = Math.floor(duration / 3600);
	            	var startTime = data[idx].time;

	            	var endHour = parseFloat(startTime.substring(0, startTime.indexOf(":"))) + hour;
	            	var endMin = parseFloat(startTime.substring(startTime.indexOf(":") + 1)) + min;
	            	var carry = (endMin >= 60) ? 1 : 0;
	            	endMin = (endMin >= 60) ? endMin-60 : endMin;
	            	endHour += carry;

	            	if(endHour >= 24) endHour -= 24;
	            	var endHourStr = endHour.toString();
	            	if(endHour <= 9) endHourStr = "0" + endHourStr;

	            	var endMinStr = endMin.toString();
	            	if(endMin <= 9) endMinStr = "0" + endMinStr;
	            	var endTime = endHourStr + ":" + endMinStr;

	            	tableRow += "<tr class=\"info day"+day+" room_"+room+" booking_"+data[idx].id+"\" data-index=\"" + idx + "\">" + 
	                                "<td colspan=\"2\"><span class=\"time\">"+ startTime +" - " + endTime + "</span></td>" + 
	                                "<td>"+ data[idx].event + "</td>" + 
	                                "<td>"+ data[idx].room +"</td>" + 
	                                "<td class=\"edit_booking\"></td></tr>";          

	                ++idx;

	                if(idx < data.length && day != parseFloat(data[idx].date.substring(0,2))){
	                	day++;
	                } else if (idx >= data.length) {
	                	day++;
	                }

				} else {
					tableRow += "<tr>" +
                                "<td id=>"+ day + ".</td>" + 
                                "<td colspan=\"4\" class=\"datetag\"><a id=\"day" + day +"_more\" href=\"javascript:void(0);\"></a></td>"+
                          		"</tr>";
                    day++;	
				}
			}
		}
		$tbody.html(tableRow);
		createDescriptions();
		bookingsBelongingUser();
		updateFrameSize();
	};

	/**
	*	adds the description popovers for all bookings to the table rows
	*/ 
	function createDescriptions(){

		var data = BOOKINGS.data;

		for(var idx=0; idx<data.length; idx++){
		$(".booking_" + data[idx].id).each(function(){$(this).popover({
                	title: data[idx].event,
                	content: data[idx].description + "\n\nby" + data[idx].name,
                	delay: 500,
                	trigger: 'hover',
                	placement: 'top'
                })});
		}
	};

	/**
	*	requests the bookings of the currently logged in user
	*/
	function bookingsBelongingUser(){
		$.post(REQUEST_URL + '?function=getUserBookings', {'month': MONTHS[CURRENTMONTH], 'year': CURRENTYEAR}, function(data){ enableEdit(data);});
	};

	/**
	*	callback of the bookingsBelongingUser function
	*	handles the received data and attaches an edit button to all bookings which belong to the user
	*/ 
	function enableEdit(dataStr){
		/**
			TODO: REQUEST RETURNS EMPTY ARRAY!!!!
		
		var data = JSON.parse(dataStr);
		console.error(data);
		**/

		var data = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28];
		var bookingId;

		for(var i=0; i<data.length; i++){
			//console.error(data[i]);

			bookingId = data[i];
			var $editLink = $("<a href=\"javascript:void(0);\" alt=\"Edit..\" data-bookingId=\"" + bookingId + "\">Edit..</a>").click(showEditOverlay);
			$(".booking_"+bookingId.toString()+" > td.edit_booking").html($editLink);
		}
	};

	/**
	*	is called when the overlay is displayed. It either shows the delete button or resets the overlay
	*/
	function prepareOverlay(){
		if($("#saveChanges").attr("data-bookingId") != "-1"){
			$("#deleteBookingButton").show();
		} else {
			$("#roomField").val(ROOMS[0]);
			$("#eventField").val("");
			$("#dateField").val("");
			$("#timeHour").val("0");
			$("#timeMinute").val("0");
			$("#durationHour").val("0");
			$("#durationMinute").val("0");
			$("#descriptionField").val("");
			$("#deleteBookingButton").hide();
		}
	};

	/**
	*	creates a new booking or updates a booking
	*/
	function createBooking(bookingId, room, newEvent, date, time, duration, description){
		if(bookingId != "-1"){
			$.post(REQUEST_URL + '?function=updateBooking', {'bookingId': bookingId, 'room': room, 'event': newEvent, 'date': date, 'time': time, 'duration': duration, 'description': description}, showResponseCreate);
		} else {
			$.post(REQUEST_URL + '?function=updateBooking', {'room': room, 'event': newEvent, 'date': date, 'time': time, 'duration': duration, 'description': description}, showResponseCreate);
		}
	};

	/**
	*	handles the response of the create function
	*/
	function showResponseCreate(response){

		if(response.indexOf("[[400]]")){
			$("#alert_success h4").html("Booking created!");
			$("#alert_success span").html("Your booking has been created! Enjoy...");
			$("#alert_success").show();
		} else if(response.indexOf("[[500]]")) {
			$("#alert_error").show();
			$("#message_error span").html(response);
		}

		$("#overlayBooking").modal("hide");
		fetchEventsMonth();
	};

	/**
	*	is called when you click the edit button to set the content in the overlay with the values of the booking
	*/
	function showEditOverlay(e){

		var bookingId = $(e.target).attr("data-bookingId");

		$("#saveChanges").attr("data-bookingId", bookingId);

		console.error($("#saveChanges").attr("data-bookingId"));

		var idx = $(".booking_" + bookingId.toString()).attr("data-index");

		var booking = BOOKINGS.data[idx];

		$("#roomField").val(booking.room);
		$("#eventField").val(booking.event);
		$("#dateField").val(booking.date);
		$("#timeHour").val(parseFloat(booking.time.substring(0, booking.time.indexOf(":"))));
		$("#timeMinute").val(parseFloat(booking.time.substring(booking.time.indexOf(":") + 1)));
		$("#durationHour").val(Math.floor(booking.duration / 3600));
		$("#durationMinute").val(Math.floor((booking.duration % 3600) / 60));
		$("#descriptionField").val(booking.description);

		$("#overlayBooking").modal("show");
	};

	/**
	*	Is called when you want to save the booking (update or create). It reads the chosen values and if all are set 
	* 	calls the createBooking function
	*/
	function updateBooking(){
		var bookingId = $("#saveChanges").attr("data-bookingId");

		var room = $("#roomField").val();
		var newEvent = $("#eventField").val();
		var date = $("#dateField").val();
		var timeHour = $("#timeHour").val();
		var timeMin = $("#timeMinute").val();
		var durationHour = $("#durationHour").val();
		var durationMin = $("#durationMinute").val();

		var time = timeHour + ":" + timeMin;
		var duration = ((parseInt(durationMin)*60) + (parseInt(durationHour)*3600)).toString();

		var description = $("#descriptionField").val();

		if (room == "" || newEvent == "" || date == "" || description == "" || (parseFloat(durationHour) == 0 && parseFloat(durationMin) == 0)){
			$("#booking_message").show();
			return;
		}

		createBooking(bookingId, room, newEvent, date, time, duration, description);
	};

	/**
	*	Used to delte a booking from the server
	*/
	function deleteBooking(){
 		var bookingId = $("#saveChanges").attr("data-bookingId");

 		if(bookingId != "-1"){
 			$.post(REQUEST_URL + "?function=deleteBooking", {"bookingId": bookingId}, handleDelete);
 		}
 	};

 	/**
 	*	handles the response of the deleteBooking function
 	*/
	function handleDelete(data){
		var dataStr = JSON.parse(data);

		console.error(dataStr);

		if(dataStr.indexOf("[[400]]")){
			$("#alert_success h4").html("Booking deleted!");
			$("#alert_success span").html("Your booking has been deleted...");
			$("#alert_success").show();
		} else if(dataStr.indexOf("[[500]]")){
			$("#alert_error span").html(dataStr);
			$("#alert_error").show();
		}

		fetchEventsMonth();
		updateFrameSize();
		$("#overlayBooking").modal("hide");
	};

})(jQuery);