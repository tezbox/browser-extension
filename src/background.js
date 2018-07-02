var send_message = {status : 'cancelled'};
var sign_message = {status : 'cancelled'};
var sign_result = sign_message;
var send_result = send_message;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var tb = JSON.parse(localStorage.getItem('tbstore'));
    if (!tb) {
      sendResponse({data: {status : 'unavailable'}});
    } else if (request.method == "status"){
      if (typeof tb.temp == 'undefined') {
        sendResponse({data: {status : 'locked'}});
      } else {
        sendResponse({data: {
          status : 'success',
          activeAccount: tb.accounts[tb.account],
          accounts: tb.accounts,
        }});
      }
    } else if (request.method == "getActiveAccount"){
      sendResponse({data: tb.accounts[tb.account]});
    } else if (request.method == "getAllAccounts"){
      sendResponse({data: tb.accounts});
    } else if (request.method === "resolvedSign") {
      sign_result = {status : 'success', signed : request.data};
    } else if (request.method === "dismissedSign") {
      sign_result = {status : 'cancelled'};
    } else if (request.method === "resolvedTransaction") {
      send_result = {status : 'success', operation : request.data};
    } else if (request.method === "dismissedTransaction") {
      send_result = {status : 'cancelled', error : request.data};
    } else if (request.method == "initiateTransaction"){
      if (typeof tb.temp == 'undefined') {
        sendResponse({data: {status : 'locked'}});
      } else {
        chrome.storage.local.set({ 
          'transferData': {
            'tb' : tb,
            'transfer' : request.data
          }      
        });
        chrome.windows.create({'url': chrome.extension.getURL("api_send.html"), 'type': 'popup','width': 387, 'height': 600,}, function(w) {
          chrome.windows.onRemoved.addListener(function l(id) {
            if(id === w.id){
              sendResponse({data: send_result});
              send_result = send_message;
              chrome.windows.onRemoved.removeListener(l);
            }
          });          
        });
        return true;
      }
    } else if (request.method == "signMessage"){
      if (typeof tb.temp == 'undefined') {
        sendResponse({data: {status : 'locked'}});
      } else {
        chrome.storage.local.set({ 
          'signData': {
            'tb' : tb,          
            "message" : request.data,
          }
        });
        chrome.windows.create({'url': chrome.extension.getURL("api_sign.html"), 'type': 'popup','width': 387, 'height': 600,}, function(w) {
          chrome.windows.onRemoved.addListener(function l(id) {
            if(id === w.id){
              sendResponse({data: sign_result});
              sign_result = sign_message;
              chrome.windows.onRemoved.removeListener(l);
            }
          });          
        });
        return true;
      }
    } else
      sendResponse({error:true});
});