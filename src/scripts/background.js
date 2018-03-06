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
      eztz.rpc.getBalance(tb.account.tz1)
      .then((r) => {
        balance = eztz.utility.formatMoney(r/100, 2, '.', ',')+"ꜩ";
        tb.account.balance = balance;
        tb.account.raw_balance = r;
        localStorage.setItem("tbstore", JSON.stringify(tb));
        sendResponse({data: tb.account});
      });
      return true;
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
        chrome.windows.create({'url': chrome.extension.getURL("send.html"), 'type': 'popup','width': 357, 'height': 500,}, function(w) {
          var l = (id) => {
            if(id === w.id){
              chrome.windows.onRemoved.removeListener(l);
              sendResponse({data: tb.accounts});
            }
          };
          chrome.windows.onRemoved.addListener(l);
        });
        return true;
      }
    } else
      sendResponse({error:true}); // snub them.
});