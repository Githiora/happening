// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var constants = {
  EVENTBRITE_WEBSITE : 'https://www.eventbrite.com/',
  EVENTBRITE_SEARCH_EVENTS_URL:'https://www.eventbriteapi.com/v3//events/search/',
  EVENTBRITE_ACCESS_TOKEN:'2QV6ZWXHUFWULSULYHQL',
  STATUS_OK:200,

  // number of events from Eventbrite API. Should not be greater than 50
  EVENTS_NUM : 10
};

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getImageUrl(searchTerm, callback, errorCallback) {
  // Google image search - 100 searches per day.
  // https://developers.google.com/image-search/
  var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
    '?v=1.0&q=' + encodeURIComponent(searchTerm);
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);
  // The Google image search API responds with JSON, so let Chrome parse it.
  x.responseType = 'json';
  x.onload = function() {
    // Parse and process the response from Google Image Search.
    var response = x.response;
    if (!response || !response.responseData || !response.responseData.results ||
        response.responseData.results.length === 0) {
      errorCallback('No response from Google Image search!');
      return;
    }
    var firstResult = response.responseData.results[0];
    // Take the thumbnail instead of the full image to get an approximately
    // consistent image size.
    var imageUrl = firstResult.tbUrl;
    var width = parseInt(firstResult.tbWidth);
    var height = parseInt(firstResult.tbHeight);
    console.assert(
        typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
        'Unexpected response from the Google Image Search API!');
    callback(imageUrl, width, height);
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

/**
 * Display current status of extension
 * @param statusText - string value to be printed
 */
function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

/**
 * Get the user's location
 * @param geoSuccess - Callback function when location coords are obtained
 * @param geoError - Optional callback when location coords are not obtained
 * @param geoOptions - Optional callback for specifying constraints such as timeout
 */
function getUsersLocation(geoSuccess, geoError, geoOptions){

  navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

}

/**
 * Dynamically create unordered list of events for display. Items limited to value of EVENTS_NUM
 * @param myArr - Array containing events objects retrieved from Eventbrite
 */
function createUnorderedList(myArr) {

  // Create the list element:
  var list = document.getElementById('list');

  // navigate to event page on click
  list.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI'){
      window.open(e.target.href);
    }
  });

  for(var i = 0; i < constants.EVENTS_NUM; i++) {
    // Create the list item:
    var item = document.createElement('li');
    item.style.marginBottom = '10px';
    item.style.marginLeft = '0px';
    item.style.cursor = 'pointer';

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
function getEvents(lat, long) {

  var searchUrl = constants.EVENTBRITE_SEARCH_EVENTS_URL +'?token='+constants.EVENTBRITE_ACCESS_TOKEN+'&location.latitude' +
      '='+lat+'&location.longitude='+long+'&popular=true';
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);

  x.onload = function() {
    if (x.readyState == 4 && x.status == constants.STATUS_OK) {
      var events = JSON.parse(x.responseText);

      console.log(events);
      renderStatus("Popular events near you. Click to view event");

      createUnorderedList(events);

      var elem = document.getElementById('view_more');
      elem.hidden = false;
      elem.onclick = openEventbriteWebsite;

    }else{ // Error occurred
      console.log("XMLHttpRequest error: "+ x.statusText);
      renderStatus("Unable to get events. Please try again later");
    }
  };
  x.send();
}

function openEventbriteWebsite(){
  window.open(constants.EVENTBRITE_WEBSITE);
}
document.addEventListener('DOMContentLoaded', function() {

  renderStatus("Loading...");

  // check for Geolocation support
  if (navigator.geolocation) {
    console.log('Geolocation is supported!');

    var geoOptions = {

      // get cached location in milliseconds
      maximumAge: 5 * 60 * 1000,

      // timeout value in milliseconds
      timeout: 10 * 1000
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
