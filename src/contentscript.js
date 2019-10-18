window.addEventListener("message", function(event) {
  if (event.source != window || event.data.direction != "in")
    return;
  var dd = {};
  if (typeof event.data.data != "undefined")
    dd = event.data.data;
  chrome.runtime.sendMessage({action: "tbapi", method: event.data.type, data : dd}, function(response) {
  	if(response)
    	window.postMessage({ direction : "out", type : event.data.type, response : response}, "*");
  });
}, false);
