<?php 
	/* 
		Is rendered when the admin includes

		[multimediaBooking]

		into his page
	*/
?>

<?php if(is_user_logged_in()){ ?>
		<style>
			#mp_frame{
				width: 100%;
				height: 100%;
			}
		</style>

		<div id="multimedia_booking_container"><iframe id="mp_frame" src="wp-content/plugins/multimedia_booking/public/index.html" onload="resizeFrame(document.getElementById('mp_frame'))"></iframe></div>

		<script>

			jQuery(window).bind("sizeFrameChanged", function(){resizeFrame(document.getElementById("mp_frame"));});

			window.location.hash = "";
			
			function resizeFrame(f){
				f.style.height = "0px";
				f.style.height = f.contentWindow.document.body.scrollHeight + "px";
			}
		</script>
<?php } else { ?>
		<h2>Log-in required!</h2>
		<p>Please log-in to see the bookings</p>
<?php } ?>

