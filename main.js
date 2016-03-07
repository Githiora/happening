/**
 * Created by Githiora_Wamunyu on 3/7/2016.
 */
chrome.runtime.sendMessage ( {command: "gimmeGimme"}, function (response) {
    console.log (response.geoLocation);
} );