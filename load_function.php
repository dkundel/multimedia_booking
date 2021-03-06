<?php

/*
 * Check if  the assigned function exists and executes it
 */
require_once 'class/Booking.php';

if ($_GET['function']) {
    $function = "mb_" . $_GET['function'];
    if (function_exists($function)) {
        $function();
    } else {
        echo json_encode("[[500]] Function does not exist");
        exit;
    }
} else {
    //echo json_encode("Function not assigned");
    //exit;
}

function mb_getMonthEvents() {
    $month = $_POST['month'];
    $year = $_POST['year'];
    $bookings = Booking::getMonthEvents($month, $year);
    if(!$bookings){
            echo json_encode('[[500]] No bookings for this month');
            exit;
        }
    echo json_encode($bookings);
    exit;
}

function mb_deleteBooking() {
    $id = $_POST['bookingId'];
    try {
        $booking = Booking::getInstance($id);
        $booking->delete();
    } catch (Exception $e) {
        if ($e->getMessage()) {
            $response = array('type' => 500, 'message' => $e->getMessage());
            echo json_encode($response);
            exit;
        }
    }
    $response = array('type' => 400, 'message' => 'Your booking has been deleted...');
    echo json_encode($response);
    exit;
}

function mb_updateBooking() {
    $id = $_POST['bookingId'];

    $params['room'] = $_POST['room'];
    $params['event'] = $_POST['event'];
    $params['date'] = strtotime($_POST['date']);
    $params['time'] = strtotime($_POST['time']);
    $params['duration'] = $_POST['duration'];
    $params['description'] = $_POST['description'];

    try {
        $booking = Booking::getInstance($id);
        $booking->setParameters($params);
        $booking->update();
    } catch (Exception $e) {
        if ($e->getMessage()) {
            $response = array('type' => 500, 'message' => $e->getMessage());
            echo json_encode($response);
            exit;
        }
    }
    $response = array('type' => 400, 'message' => 'Booking updated! Enjoy...');
    echo json_encode($response);
    exit;
}

function mb_getUserBookings() {
    $month = $_POST['month'];
    $year = $_POST['year'];
    try {
        $bookings = Booking::getUserBookings($month, $year);

    } catch (Exception $e) {
        $bookings = '[[500]]'.$e->getMessage();
    }
    echo json_encode($bookings);
    exit;
}
