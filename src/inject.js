var tbapiListener = [];
window.addEventListener("message", function(event) {
  if (event.source != window || event.data.direction != "out")
    return;
	if (typeof tbapiListener[event.data.type] != 'undefined') tbapiListener[event.data.type](event.data.response);
}, false);
window.tbapi = {
	requestAccess : function(){
    return new Promise(function (resolve, reject) {
      tbapiListener["requestAccess"] = resolve;
      window.postMessage({ direction : "in", type : "requestAccess"}, "*");
    });
  },
	haveAccess : function(){
    return new Promise(function (resolve, reject) {
      tbapiListener["haveAccess"] = resolve;
      window.postMessage({ direction : "in", type : "haveAccess"}, "*");
    });
  },
  getActiveAccount : function(){
    return new Promise(function (resolve, reject) {
      tbapiListener["getActiveAccount"] = resolve;
      window.postMessage({ direction : "in", type : "getActiveAccount"}, "*");
    });
  },
  getAllAccounts : function(){
    return new Promise(function (resolve, reject) {
      tbapiListener["getAllAccounts"] = resolve;
      window.postMessage({ direction : "in", type : "getAllAccounts"}, "*");
    });
  },
  initiateTransaction : function(from, to, amount, data, gasLimit, storageLimit, fee){
    return new Promise(function (resolve, reject) {
      tbapiListener["initiateTransaction"] = resolve;
      window.postMessage({ direction : "in", type : "initiateTransaction", data:{
				from : from,
				to : to,
				amount : amount,
				data : data,
				gasLimit : gasLimit,
				storageLimit : storageLimit,
				fee : fee
			}
			}, "*");
    });
  },
  signData : function(d){
    return new Promise(function (resolve, reject) {
      tbapiListener["signData"] = resolve;
      window.postMessage({ direction : "in", type : "signData", data:d}, "*");
    });
  }
}
if (typeof window.tbapiOnload != "undefined"){
  window.tbapiOnload();
}