window.addEventListener("message", function(event) {
  if (event.source != window || event.data.direction != "in")
    return;
  var dd = {};
  if (typeof event.data.data != "undefined")
    dd = event.data.data;
  chrome.runtime.sendMessage({method: event.data.type, data : dd}, function(response) {
    window.postMessage({ direction : "out", type : event.data.type, response : response.data}, "*");
  });
}, false);

var s = document.createElement('script');
s.src = chrome.extension.getURL('scripts/inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
console.log("TezBox has been injected!");