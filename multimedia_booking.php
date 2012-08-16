<?php

/*
 * Plugin name: Multimedia booking
 * plugin URI: #
 * Descriptio: Plugin for booking the multimedia room 
 * Version: 1.0
 * Author: George Merticaiu and Dominik Kundel
 * Author URI: #
 * Licence: GPL
 */

global $wpdb;
define('BOOKING_TABLE_NAME', $wpdb->prefix . "multimedia_booking");
date_default_timezone_set("Europe/Berlin");

register_activation_hook(__FILE__, 'multimedia_booking_install');
register_deactivation_hook(__FILE__, 'multimedia_booking_uninstall');

function multimedia_booking_install() {
    $sql = "CREATE TABLE IF NOT EXISTS " . BOOKING_TABLE_NAME . " (
	  id mediumint(9) NOT NULL AUTO_INCREMENT,
          userId mediumint(9),
          event varchar(255),
          room varchar(100),
          date int(13),
          time int(13),
          duration int(13),
          description TEXT,
	  UNIQUE KEY id (id)
	);";
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

function multimedia_booking_uninstall() {
    global $wpdb;
    $query = "DROP TABLE IF EXISTS " . BOOKING_TABLE_NAME;
    $wpdb->query($query);
}

function render_booking($atts) {
    include('load_function.php');
    include('bookingTemplate.php');
}

add_shortcode('multimediaBooking', 'render_booking');


