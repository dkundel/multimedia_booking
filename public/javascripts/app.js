(function($){

	var ROOMS = ['Movie Room','TV Lounge', 'Party Room', 'XBox'];
	var MONTHS = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	var CURRENTDAYS;
	var CURRENTMONTH;
	var CURRENTYEAR;

	var ROWHEIGHT;

	var BOOKINGS = {};

	var REQUEST_URL = "/github/wordpress/wp-content/plugins/multimedia_booking/load_function.php";
	
	$(document).ready(function(){

		$("#dateField").datepicker({dateFormat: "dd-mm-yy"});

		var today = new Date();
		CURRENTMONTH = today.getMonth();
		CURRENTYEAR = today.getFullYear();
		CURRENTDAYS = getDaysPerMonth(CURRENTMONTH, CURRENTYEAR);

		ROWHEIGHT = $("#calendar table tbody th").css("height");

		for(var i=0; i<ROOMS.length; i++){
			$("#roomSelect").append("<option>" + ROOMS[i] + "</option>");
			$("#roomField").append("<option>" + ROOMS[i] + "</option>");
		}

		for(var i=0; i<24; i++){
			$("#timeHour").append("<option>" + i + "</option>");}
		for(var i=0; i<=45; i+=15){
			$("#timeMinute").append("<option>" + i + "</option>");
		}

		fillDurationSlots(true, true);
		$("#durationHour").change(updateDurations);

		$("#day1_more").click(function(){$(".day1").each(function(){$(this).toggle("slow");});});

		$("#overlayBooking").bind('show', function(){prepareOverlay();});

		$("#openbooking").click(function(){$("#saveChanges").attr("data-bookingId", "-1"); $("#overlayBooking").modal('show')});

		$("#roomSelect").change(hideBookings);

		$("#saveChanges").click(function(){updateBooking();});
		$("#deleteBookingButton").click(function(){deleteBooking();})


		$(".prevMonth").click(showPrevMonth);
		$(".nextMonth").click(showNextMonth);
		
		//testCreate();

		fetchEventsMonth();

	});

 	function deleteBooking(){
 		return;
 	}


	function showPrevMonth(){
		CURRENTMONTH--;
		if (CURRENTMONTH <= 0) {
			CURRENTYEAR--;
			CURRENTMONTH += 12;
		}

		$(".monthheadline").html(MONTHS[CURRENTMONTH] + " " + CURRENTYEAR);

		fetchEventsMonth();
		updateFrameSize();
	}

	function showNextMonth(){
		CURRENTMONTH++;
		if (CURRENTMONTH >= 12) {
			CURRENTYEAR++;
			CURRENTMONTH -= 12;
		}

		$(".monthheadline").html(MONTHS[CURRENTMONTH] + " " + CURRENTYEAR);

		fetchEventsMonth();
		updateFrameSize();
	}

	function updateBooking(){
		var bookingId = $("#saveChangesBooking").attr("data-bookingId");



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

		createBooking(bookingId, room, newEvent, date, time, duration, description);
	}


	function prepareOverlay(){
		if($("#saveChangesBooking").attr("data-bookingId") != "-1"){
			$("#deleteBookingButton").show();
		}
		return;
	}

	function showEditOverlay(e){

		var bookingId = $(e.target).attr("data-bookingId");

		$("#saveChangesBooking").attr("data-bookingId", bookingId);
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
	}

	function testCreate(){
		createBooking(ROOMS[0], 'Test1', '16-08-2012', '05:14', '1000', 'bla');
		createBooking(ROOMS[1], 'Test2', '017-08-2012', '05:14', '1000', 'bla');
		createBooking(ROOMS[2], 'Test3', '18-08-2012', '05:14', '1000', 'bla');
		createBooking(ROOMS[3], 'Test4', '19-08-2012', '05:14', '1000', 'bla');

	}

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
	}

	function showResponseCreate(response){
		console.error(response);
		
		if(response.indexOf("[[400]]")){
			$("#alert_success").show();
		} else if(response.indexOf("[[500]]")) {
			$("#alert_error").show();
			$("#message_error span").html(response);
		}


		$("#overlayBooking").modal("hide");
		fetchEventsMonth();

	}

	function createBooking(bookingId, room, newEvent, date, time, duration, description){
		if(bookingId != "-1"){
			console.error("UPDATE!!");
			$.post(REQUEST_URL + '?function=updateBooking', {'bookingId': bookingId, 'room': room, 'event': newEvent, 'date': date, 'time': time, 'duration': duration, 'description': description}, showResponseCreate);
		} else {
			$.post(REQUEST_URL + '?function=updateBooking', {'room': room, 'event': newEvent, 'date': date, 'time': time, 'duration': duration, 'description': description}, showResponseCreate);
		}
		
	}


	function updateFrameSize(){
		parent.$(window.parent).trigger("sizeFrameChanged");
	};

	function updateDurations(){
		$("#durationHour option:selected").each(function(){
			if($(this).text() == '4'){
				$("#durationMinute").html("<option selected>0</option>");
			} else {
				fillDurationSlots(false, true);
			}
		});
	}

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
	}

	function getDaysPerMonth(month, year){
		return new Date(year, month, 0).getDate();
	}

	function showEvents(){
		return 0;
	}

	/** TODO: Events on days that are right after eachother -> day is skipped **/

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

		while(true){

			if(idx >= data.length) {
				endOfEvents = true;
			} else {
				nextEvent = data[idx].date.substring(0,2);
				//console.error("current day:" + day + "; day:" + nextEvent + "; event:" + data[idx].event);
				if(day != nextEvent && !writeDate){
					//console.error("skip next day");
					day++;
					//writeDay = true;
				}
			};

			if(endOfEvents && day == CURRENTDAYS) break;

			//console.error(day == nextEvent);
			if(day != nextEvent || endOfEvents){
				tableRow += "<tr>" +
                                "<td id=>"+ day + ".</td>" + 
                                "<td colspan=\"4\" class=\"datetag\"><a id=\"day" + day +"_more\" href=\"javascript:void(0);\"></a></td>"+
                           "</tr>";
                $("#day" + day + "_mode").click(showEvents(day));
                writeDate = true;
                day++;
            } else if (day == nextEvent && writeDate) {
            	 tableRow += "<tr>" +
                                "<td id=>"+ day + ".</td>" + 
                                "<td colspan=\"4\" class=\"datetag\"><a id=\"day" + day +"_more\" href=\"javascript:void(0);\"></a></td>"+
                           "</tr>";
                $("#day" + day + "_mode").click(showEvents(day));
                writeDate = false;
            } else {

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
            	console.error(data[idx].event);

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

                bookingBelongsUser(data[idx].id);
          
                ++idx;
			}
		}

		$tbody.html(tableRow);
		updateFrameSize();
	}

	function enableEdit(dataStr, bookingId){
		/**
			TODO: REQUEST RETURNS EMPTY ARRAY!!!!
		
		var data = JSON.parse(dataStr);
		console.error(data);
		**/

		var data = [17, 5, 7, 16];
		var bookingId;

		for(var i=0; i<data.length; i++){
			//console.error(data[i]);

			bookingId = data[i];
			var $editLink = $("<a href=\"javascript:void(0);\" alt=\"Edit..\" data-bookingId=\"" + bookingId + "\">Edit..</a>").click(showEditOverlay);
			$(".booking_"+bookingId.toString()+" > td.edit_booking").html($editLink);
		}
	}

	function bookingBelongsUser(bookingId){
		console.error(MONTHS[CURRENTMONTH], CURRENTYEAR);
		$.post(REQUEST_URL + '?function=getUserBookings', {'month': MONTHS[CURRENTMONTH], 'year': CURRENTYEAR}, function(data){ enableEdit(data, bookingId);});
	}

	function fetchEventsMonth(){
		

		$.post(REQUEST_URL + '?function=getMonthEvents', {'month': MONTHS[CURRENTMONTH], 'year': CURRENTYEAR}, displayEventsMonth);
	}




})(jQuery);