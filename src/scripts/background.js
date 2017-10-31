chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var tb = JSON.parse(localStorage.getItem('tbstore'));
    if (!tb) {
      sendResponse({data: "unavailable"});        
    } else if (request.method == "status"){
      if (typeof tb.temp.mnemonic == 'undefined') {
        sendResponse({data: "locked"});        
      } else {
        sendResponse({data: "available"});        
      }
    } else if (request.method == "getActiveAccount"){
      sendResponse({data: tb.account});
    } else if (request.method == "getAllAccounts"){
      sendResponse({data: tb.accounts});
    } else if (request.method == "initiateTransaction"){
      if (typeof tb.temp.mnemonic == 'undefined') {
        sendResponse({data: tb.accounts});
      } else {
        chrome.storage.local.set({ 
          'transferData': {
            'tb' : tb,
            'transfer' : request.data
          }      
        });
        chrome.windows.create({'url': chrome.extension.getURL("send.html"), 'type': 'popup','width': 357, 'height': 500,}, function(window) {
         });
        sendResponse({data: tb.accounts});
      }
    } else
      sendResponse({error:true}); // snub them.
});