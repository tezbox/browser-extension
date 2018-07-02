app.controller('SignController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.message = '';
    var ss;
    chrome.storage.local.get("signData", function (result) {
      $scope.$apply(function(){
        ss = result.signData.tb;
        $scope.message = result.signData.message;
        console.log(result);
        if (!ss || !ss.ensk){
             window.close();
        } else if (!ss.temp.sk || !ss.temp.pkh || !ss.temp.pk){
             window.close();
        }
      });
    });
    $scope.sign = function(){
        var res = eztz.library.sodium.crypto_sign_detached($scope.message, eztz.utility.b58cdecode(ss.temp.sk, eztz.prefix.edsk))
        chrome.runtime.sendMessage({ method: "resolvedSign", data: {signature : eztz.utility.buf2hex(res), message : $scope.message} });
        window.close();
    };
    $scope.cancel = function(){
      chrome.runtime.sendMessage({ method: "dismissedSign", data: "Sign Canceled!" });
      window.close();
    }
}])
;
