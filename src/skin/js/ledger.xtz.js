window.tezledger = {};
window.tezledger.getAddress = function(path){
  return new Promise(function(resolve, reject){
    chrome.runtime.sendMessage({
      action: "getAddress",
      data: {path : path}
    },
    function (r) {
      if (typeof r.success != 'undefined' && r.success) resolve(r.data);
      else reject(r.data);
    });
  });
}

window.tezledger.sign = function(path, data){
  return new Promise(function(resolve, reject){
    chrome.runtime.sendMessage({
      action: "sign",
      data: {path : path, data : data}
    },
    function (r) {
      if (typeof r.success != 'undefined' && r.success) resolve(r.data);
      else reject(r.data);
    });
  });
}