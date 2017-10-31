var listener = [];
window.addEventListener("message", function(event) {
  if (event.source != window || event.data.direction != "out")
    return;
  listener[event.data.type](event.data.response);
}, false);
window.tbapi = {
  status : function(){
    return new Promise(function (resolve, reject) {
      listener["status"] = resolve;
      window.postMessage({ direction : "in", type : "status"}, "*");
    });
  },
  getActiveAccount : function(){
    return new Promise(function (resolve, reject) {
      listener["getActiveAccount"] = resolve;
      window.postMessage({ direction : "in", type : "getActiveAccount"}, "*");
    });
  },
  getAllAccounts : function(){
    return new Promise(function (resolve, reject) {
      listener["getAllAccounts"] = resolve;
      window.postMessage({ direction : "in", type : "getAllAccounts"}, "*");
    });
  },
  initiateTransaction : function(d){
    return new Promise(function (resolve, reject) {
      listener["initiateTransaction"] = resolve;
      window.postMessage({ direction : "in", type : "initiateTransaction", data:d}, "*");
    });
  }
}
if (typeof window.tbapiOnload != "undefined"){
  window.tbapiOnload();
}