chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("main.html") });
});

//Ledger integration
var ii = document.createElement('iframe');
ii.setAttribute('src', 'https://tezbox.com/ledger/');
ii.setAttribute('id', 'the_iframe');
document.body.appendChild(ii);
var iframe = document.getElementById('the_iframe');

var actions = {
  "sign" : false,
  "getAddress" : false,
};

function ledgerBridge(action, data){
  return new Promise(function(resolve, reject){
    data.target = "LEDGER-IFRAME";
    data.action = action;
    actions[action] = [resolve, reject];
    iframe.contentWindow.postMessage(data, "*");
  });  
}
window.addEventListener("message", function(e){
  if (e && e.data && e.data.target === 'TEZBOX-EXT') {
    if (typeof e.data.success != 'undefined' && e.data.success){
      actions[e.data.action][0](e.data.data);      
    } else {
      actions[e.data.action][1](e.data.data);      
    }
    actions[e.data.action] = false;
  }
}, false);

chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
  ledgerBridge(request.action, request.data)
  .then(function(r){
    sendResponse({success:true, data:r});
  })
  .catch(function(r){
    sendResponse({success:false, data:r});
  }); 
  return true;
});