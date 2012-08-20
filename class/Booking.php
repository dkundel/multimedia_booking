<?php

require_once __DIR__."/../../../../wp-load.php";

class Booking {

    private $room;
    private $event;
    private $date;
    private $duration;
    private $time;
    private $id;
    private $user;
    private $description;
    private $userId;
    private static $instance;

    private function __construct($id) {

        global $wpdb;
        global $current_user;
        get_currentuserinfo();
        $this->db = $wpdb;
        $this->user = $current_user;
        if ($id) {
            $this->id = $id;
            $query = "SELECT `userId`,`room`, `event`, `date`,`time`,`duration`,`description` FROM " . BOOKING_TABLE_NAME . " WHERE `id`=" . (int) $id;
            $params = $this->db->get_results($query);

            if (!$params) {
                throw new Exception('Invalid booking id');
            } else {
                if ($params[0]->userId != $this->user->ID && $this->user->roles[0] != 'administrator' ) {
                    throw new Exception('This booking belongs to other user');
                }
                $this->setParameters($params[0]);
            }
        } else {
            $this->userId = $this->user->ID;
        }
    }

    public static function getInstance($id = false, $refresh = false) {
        if ($refresh)
            unset(self::$instance[$id]);

        if (!self::$instance[$id]) {
            self::$instance[$id] = new Booking($id);
        }

        return self::$instance[$id];
    }

    public function setParameters($params) {
        foreach ($params as $key => $value) {
            $this->$key = $value;
        }
    }

    public function update() {
        $this->checkValues();
        $params = array();
        $params['userId'] = $this->userId;
        $params['room'] = $this->room;
        $params['event'] = $this->event;
        $params['date'] = $this->date;
        $params['time'] = $this->time;
        $params['duration'] = $this->duration;
        $params['description'] = $this->description;
        if ($this->duration > 14400) {
            throw new Exception("The room cannot be booked for more than 4 hours");
        }
        if (!$this->validTime($this->room, $this->date, $this->time, $this->duration)) {
            throw new Exception("Room already booked in the selected time");
        }
        if ($this->id) {
            $this->db->update(BOOKING_TABLE_NAME, $params, array('id' => $this->id));
        } else {
            $this->db->insert(BOOKING_TABLE_NAME, $params);
        }
    }

    public function delete() {
        if ($this->id) {
            $this->db->delete(BOOKING_TABLE_NAME, array('id' => $this->id));
        } else {
            throw new Exception("Invalid booking id");
        }
    }

    private function checkValues() {
        $vars = get_class_vars(get_class());
        foreach ($vars as $key => $value) {
            if ($key == "instance" || $key == "description" || $key = "id") {
                continue;
            }
            if (!$this->$key) {
                throw new Exception("Please insert a value for {$key}");
            }
        }
    }

    public function validTime($room, $date, $time, $duration) {
        $query = "SELECT `room`,`time`,`duration` FROM " . BOOKING_TABLE_NAME . " WHERE `date`=" . (int) $date . " AND room='" . $this->db->escape($room) . "'";
        $bookings = $this->db->get_results($query);

        foreach ($bookings as $booking) {
            $startTime = $booking->time;
            $endTime = $booking->time + $booking->duration;
            if ($startTime <= $time && $endTime >= $time) {
                return false;
            }
            if ($startTime < $time + $duration && $endTime > $time + $duration) {
                return false;
            }
            if ($startTime > $time && $endTime < $time + $duration) {
                return false;
            }
        }
        return true;
    }

    public static function getMonthEvents($month, $year) {
        global $wpdb;
        $startDate = strtotime("01-{$month}-{$year}");
        $endDate = strtotime("01-{$month}-{$year}+1 month");
        $query = "SELECT id,userId,room, time, duration, event, date, description FROM " . BOOKING_TABLE_NAME . " WHERE date>={$startDate} AND date<{$endDate} ORDER BY date ASC, time ASC";
        $results = $wpdb->get_results($query);
        foreach ($results as $result) {
            $result->date=date('d-m-Y',$result->date);
            $result->time=date('H:i',$result->time);
            $user = get_user_by('id',$result->userId);
            $result->name = $user->first_name." ".$user->last_name;
            unset($result->userId);
        }
        return $results;
    }
    
    public static function getUserBookings($month,$year){
        /*global $current_user, $wpdb;
        get_currentuserinfo();
        $startDate = strtotime("01-{$month}-{$year}");
        $endDate = strtotime("01-{$month}-{$year}+1 month");
        $query = "SELECT id FROM " . BOOKING_TABLE_NAME . " WHERE userId={$current_user->ID} AND date>={$startDate} AND date<{$endDate} ORDER BY date ASC, time ASC";
        $results = $wpdb->get_results($query);
        return $results;*/

        global $current_user, $wpdb;
        get_currentuserinfo();
        $startDate = strtotime("01-{$month}-{$year}");
        $endTime = strtotime("01-{$month}-{$year}+1 month");

        if($current_user->roles[0] == 'administrator'){
            $query = "SELECT id FROM ".BOOKING_TABLE_NAME." WHERE date>={$startDate} AND date<{$endTime} ORDER BY date ASC, time ASC";
        } else {
            $query = "SELECT id FROM ".BOOKING_TABLE_NAME." WHERE userId={$current_user->ID} AND date>={$startDate} AND date<{$endTime} ORDER BY date ASC, time ASC";
        }
        $results = $wpdb->get_results($query);
        return $results;
    }
    
    

}