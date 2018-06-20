var default_message = "Transaction Canceled!";
var popup_result = default_message;
// default response, used when popup is closed by clicking X button (listener does not fire)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var tb = JSON.parse(localStorage.getItem('tbstore'));
    if (!tb) {
      sendResponse({data: "unavailable"});
    } else if (request.method == "status"){
      if (typeof tb.seed == 'undefined') {
        sendResponse({data: "locked"});
      } else {
        sendResponse({data: localStorage.getItem("counter")});
      }
    } else if (request.method == "getActiveAccount"){
      eztz.rpc.getBalance(tb.account.tz1)
      .then((r) => {
        var rb = parseInt(r);
        tb.account.raw_balance = rb;
        var bal = window.eztz.utility.mintotz(rb);
        tb.account.balance = window.eztz.utility.formatMoney(bal, 6, '.', ',')+"ꜩ";
        localStorage.setItem("tbstore", JSON.stringify(tb));
        sendResponse({data: tb.account});
      });
      return true;
    } else if (request.method == "getAllAccounts"){
      sendResponse({data: tb.accounts});
    } else if (request.method === "resolvedTransaction") {
      popup_result = request.data
    } else if (request.method === "dismissedTransaction") {
      popup_result = request.data
    } else if (request.method == "initiateTransaction"){
      if (typeof tb.seed == 'undefined') {
        sendResponse({data: tb.accounts});
      } else {
        chrome.storage.local.set({ 
          'transferData': {
            'tb' : tb,
            'transfer' : request.data
          }      
        });
        chrome.windows.create({'url': chrome.extension.getURL("send.html"), 'type': 'popup','width': 357, 'height': 510,}, function(w) {
          chrome.windows.onRemoved.addListener(function l(id) {
            if(id === w.id){
              sendResponse({data: popup_result});
              popup_result = default_message;
              chrome.windows.onRemoved.removeListener(l);
            }
          });          
        });
        return true;
      }
    } else
      sendResponse({error:true}); // snub them.
});