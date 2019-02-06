window.teztrezor = {};
window.teztrezor.getAddress = function(path){
  return new Promise(function(resolve, reject){
    chrome.runtime.sendMessage({
      action: "trgetAddress",
      data: {
        path : path
      }
    },
    function (r) {
      if (typeof r.success != 'undefined' && r.success) resolve(r.data);
      else reject(r.data);
    });
  });
}
window.teztrezor.sign = function(path, branch, operation, revealOp){
  return new Promise(function(resolve, reject){
    chrome.runtime.sendMessage({
      action: "trsign",
      data: {
        path : path, 
        branch : branch,
        operation : operation,
        revealOp : revealOp,
      }
    },
    function (r) {
      if (typeof r.success != 'undefined' && r.success) resolve(r.data);
      else reject(r.data);
    });
  });
}