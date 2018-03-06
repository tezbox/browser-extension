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
        balance = formatMoney(r/100, 2, '.', ',')+"ꜩ";
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
        chrome.windows.create({'url': chrome.extension.getURL("send.html"), 'type': 'popup','width': 357, 'height': 500,}, function(window) {
         });
        sendResponse({data: tb.accounts});
      }
    } else
      sendResponse({error:true}); // snub them.
});

var formatMoney = function(n, c, d, t){
  var c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };