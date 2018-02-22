app.controller('SendController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.sending = false;
    $scope.sendError = false;
    $scope.amount = window.tbpayamount;
    var ss;
    chrome.storage.local.get("transferData", function (result) {
      ss = result.transferData.tb;
      var pay = result.transferData.transfer;
      $scope.toaddress = pay.address;
      $scope.amount = pay.amount;
      $scope.parameters = pay.parameters;
      if (!ss || !ss.encryptedMnemonic){
           window.close();
      }
      if (!ss.temp.mnemonic){
           window.close();
      }
      $scope.accounts = ss.accounts;
      $scope.$apply();
    });
    $scope.send = function(){
        if (!$scope.amount || !$scope.toaddress) {
          alert("Please enter amount and a destination");
          return;
        }
        var keys = window.eztz.crypto.generateKeys(ss.temp.mnemonic, ss.temp.password);
        keys.pkh = ss.account.tz1;//todo
        $scope.sendError = false;
        $scope.sending = true;
        var am = $scope.amount * 100;
        am = am.toFixed(0);

        var operation = {
          "kind": "transaction",
          "amount": am, // This is in centiles, i.e. 100 = 1.00 tez
          "destination": $scope.toaddress,
          "parameters": ($scope.parameters ? eztz.utility.sexp2mic($scope.parameters) : $scope.parameters)
        };
        console.log(operation);
        console.log(keys);
        window.eztz.rpc.sendOperation(operation, keys, 0).then($scope.endPayment);
    }
    $scope.endPayment = function(r){
        $scope.$apply(function(){
          $scope.sending = false;
          if (typeof r.injectedOperation != 'undefined'){
            window.close();
          } else {
            $scope.sendError = true;
          }
        });
    }
    $scope.cancel = function(){
      window.close();
    }
}])
;
