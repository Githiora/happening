
// global object containing configuration items for easier modification and access
happening = function(){
  var config = {
    EVENTBRITE:{

      EVENTBRITE_WEBSITE : 'https://www.eventbrite.com/',
      EVENTBRITE_SEARCH_EVENTS_URL:'https://www.eventbriteapi.com/v3/events/search/',
      EVENTBRITE_ACCESS_TOKEN: '2QV6ZWXHUFWULSULYHQL',

      // number of events from Eventbrite API. Should not be greater than 50
      EVENTS_NUM : 10
    },
    CSS:{
      IDs:{
        status:'status',
        list:'list',
        view_more: 'view_more'
      }
    }
  };
  return{
    config:config
  }
}();

/**
 * Called when the initial HTML document has been completely loaded and parsed
 */
document.addEventListener('DOMContentLoaded', function() {

  renderStatus("Loading...");

  // check for Geolocation support
  if (navigator.geolocation) {
    console.log('Geolocation is supported!');

    var geoOptions = {

      // get cached location in milliseconds
      maximumAge: 5 * 60 * 1000,

      // timeout value in milliseconds
      timeout: 5 * 1000
    };

    var geoSuccess = function(position) {

      var latitude = position.coords.latitude;
      var long = position.coords.longitude;

      getEvents(latitude, long);
    };
    var geoError = function error(err) {
      console.log('Error occurred. Error code: ' + err.message);

      // error.code can be:
      //   0: unknown error
      //   1: permission denied
      //   2: position unavailable (error response from location provider)
      //   3: timed out

      switch (err.code){
        case err.UNKNOWN_ERR:
          renderStatus("Error unknown. Please try again later");
          break;
        case err.PERMISSION_DENIED:
          renderStatus("Please allow location services to view events");
          break;
        case err.POSITION_UNAVAILABLE:
          renderStatus("Unable to get position. Please try again later");
          break;
        case err.TIMEOUT:
          renderStatus("Timed out. Please try again later");
          break;
      }
    };
    getUsersLocation(geoSuccess, geoError, geoOptions);
  }
  else {
    console.log('Geolocation is not supported for this Browser/OS version yet.');
    renderStatus("Unable to get location. Location services not supported");
  }
});

/**
 * Get the user's location
 * @param geoSuccess - Callback function when location coords are obtained
 * @param geoError - Optional callback when location coords are not obtained
 * @param geoOptions - Optional callback for specifying constraints such as timeout
 */
function getUsersLocation(geoSuccess, geoError, geoOptions){

  "use strict";
  navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

}

/**
 * Function that calls the Eventbrite API using a personal token and a list of events near the user that are taking
 * place during the coming weekend
 * @param lat - Latitude coordinate provided by user
 * @param long - Longitude coordinate provided by user
 */
function getEvents(lat, long) {

  // searching events that are near the user, are popular and are happening on the coming weekend
  var searchUrl = happening.config.EVENTBRITE.EVENTBRITE_SEARCH_EVENTS_URL +'?token='+happening.config.EVENTBRITE
          .EVENTBRITE_ACCESS_TOKEN +'&location.latitude='+lat+'&location.longitude='
      +long+'&popular=true&start_date.keyword=this_weekend';

  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);

  x.onload = function() {

    // 4: request finished and response is ready
    // 200: OK
    if (x.readyState == 4 && x.status == 200) {

      var events = JSON.parse(x.responseText);

      console.log(events);
      renderStatus("Popular events this weekend near you. Click to view event");

      createUnorderedList(events);

      // Makes "View More" element visible and clickable
      var elem = document.getElementById(happening.config.CSS.IDs.view_more);
      elem.hidden = false;
      elem.onclick = openEventbriteWebsite;

    }else{ // Error occurred
      console.log("XMLHttpRequest error: "+ x.statusText);
      renderStatus("Unable to get events. Please try again later");
    }
  };
  x.send();
}

/**
 * Display current status of extension
 * @param statusText - string value to be printed
 */
function renderStatus(statusText) {

  "use strict";
  document.getElementById(happening.config.CSS.IDs.status).textContent = statusText;
}

/**
 * Dynamically create unordered list of events for display. Items limited to value of EVENTS_NUM
 * @param myArr - Array containing events objects retrieved from Eventbrite
 */
function createUnorderedList(myArr) {

  "use strict";
  // Create the list element:
  var list = document.getElementById(happening.config.CSS.IDs.list);

  // navigate to event page on click
  list.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI'){
      window.open(e.target.href);
    }
  });

  // ensuring that only 10 (EVENTS_NUM) or lesser items are created for display
  var length = (myArr.events.length < happening.config.EVENTBRITE.EVENTS_NUM) ? myArr.events.length :
      happening.config.EVENTBRITE.EVENTS_NUM;

  if(length == 0){ // No events taking place next weekend
    renderStatus("No events taking place near you this coming weekend. Check back soon!");

  }else {

    for(var i = 0; i < length; i++) {
      // Create the list item:
      var item = document.createElement('li');

      styleItem(item);

      //change color of item when mouse moves over it
      item.addEventListener('mouseover', function(e){
        e.srcElement.style.backgroundColor = 'bisque';
      });

      //revert to previous color after moving over item
      item.addEventListener('mouseout', function (e) {
        e.srcElement.style.background = 'white';
      });

      // set link for navigating to event on click
      item.href = myArr.events[i].url;

      // Set its contents:
      item.appendChild(document.createTextNode(myArr.events[i].name.text));

      // Add it to the list:
      list.appendChild(item);
    }
  }
}

/**
 * Adds styling to unordered list items
 * @param item
 */
function styleItem(item) {

  item.style.marginBottom = '10px';
  item.style.marginLeft = '0px';
  item.style.cursor = 'pointer';
}

/**
 * Opens Eventbrite website in case user wants to view more than EVENTS_NUM events
 */
function openEventbriteWebsite(){
  window.open(happening.config.EVENTBRITE.EVENTBRITE_WEBSITE);
}

