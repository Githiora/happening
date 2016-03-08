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
}
/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

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


function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function getUsersLocation(geoSuccess, geoError, geoOptions){

  navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

}

function makeUL(myArr) {
  // Create the list element:
  var list = document.getElementById('list');

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
    item.addEventListener('mouseover', function(e){
      e.srcElement.style.backgroundColor = 'bisque';
    });
    item.addEventListener('mouseout', function (e) {
      e.srcElement.style.background = 'white';
    });
    item.href = myArr[i].events.url;

    // Set its contents:
    item.appendChild(document.createTextNode(myArr[i].events.name.text));

    // Add it to the list:
    list.appendChild(item);
  }

  // Finally, return the constructed list:
 // return list;
}
function getEvents(lat, long) {
  var searchUrl = constants.EVENTBRITE_SEARCH_EVENTS_URL +'?token='+constants.EVENTBRITE_ACCESS_TOKEN+'&location.latitude' +
      '='+lat+'&location.longitude='+long+'&popular=true';
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);

  x.onload = function() {
    if (x.readyState == 4 && x.status == constants.STATUS_OK) {
      var myArr = JSON.parse(x.responseText);
      var arr2 = [];
      for(var i=0; i < constants.EVENTS_NUM; i++){
        arr2[i] = myArr.events[i];
      }
      //myFunction(myArr);
      console.log(myArr);
      renderStatus("Popular events near you. Click to view event");

      makeUL(arr2);
    // document.getElementById('status').appendChild(makeUL(arr2));
      var elem = document.getElementById('view_more');
      elem.hidden = false;
     // elem.style.cursor = 'pointer';
      elem.onclick = RunClick;

    }
  };
  x.send();
}

function RunClick(){
  window.open(constants.EVENTBRITE_WEBSITE);
}
document.addEventListener('DOMContentLoaded', function() {

  renderStatus("Loading...");

  // check for Geolocation support
  if (navigator.geolocation) {
    console.log('Geolocation is supported!');

    var startPos;
    var geoOptions = {
      maximumAge: 5 * 60 * 1000,
      timeout: 10 * 1000
    }

    var geoSuccess = function(position) {

      startPos = position;
      var latitude = position.coords.latitude;
      var long = position.coords.longitude;
      /*console.log("latitude=" + latitude +
          ", longitude=" + long);*/

      getEvents(latitude, long);
    };
    var geoError = function(position) {
      //TODO error code undefined
      console.log('Error occurred. Error code: ' + position);
      // error.code can be:
      //   0: unknown error
      //   1: permission denied
      //   2: position unavailable (error response from location provider)
      //   3: timed out
    };
    getUsersLocation(geoSuccess, geoError, geoOptions);
  }
  else {
    console.log('Geolocation is not supported for this Browser/OS version yet.');
  }
});
