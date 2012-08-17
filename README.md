Wordpress Plug-In "Multimedia Booking"
======================================

Initially developed for the College III website at Jacobs University Bremen

by Dominik Kundel and George Merticariu

Installation
------------

The plug-in is designed to be easy to use and requires currently only four easy steps:

###1) Include jQuery to your theme:
For this you can use the way that is described at [css-tricks.com](http://css-tricks.com/snippets/wordpress/include-jquery-in-wordpress-theme/) by just including:

Just copy the following code into the functions.php file of your theme.
```ruby
if (!is_admin()) add_action("wp_enqueue_scripts", "my_jquery_enqueue", 11);
function my_jquery_enqueue() {
    wp_deregister_script('jquery');
    wp_register_script('jquery', "http" . ($_SERVER['SERVER_PORT'] == 443 ? "s" : "") . "://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js", false, null);
    wp_enqueue_script('jquery');
}
```

###2) Download the plug-in
Download the plug-in folder and move it into wp_content/plugins of your Wordpress directory
###3) Activate the Plug-In
Go in your administration panel and activate the Multimedia Booking Plug-In. 
The necessary table for the bookings will be created then automatically.
###4) Include the plug-in in your page
Just go into the editor of the page you would like to have the plug-in in and add the following shortcode:
`[multimediaBooking]`
Afterwards publish the page and you will be able to see the plug-in.