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
      if (!ss || !ss.seed){
           window.close();
      }
      $scope.account = ss.account;

      //remove when batching is implemented
      $scope.disableSend = true;
      $scope.labelSend = false;
      var recCheckHeadHash = (hash) => {
        return new Promise(function (resolve, reject) {
          setTimeout(() => {
          window.eztz.rpc.getHeadHash()
          .then(h => {
            if (h === hash) {
              $scope.disableSend = true;
              $scope.labelSend = true;
              recCheckHeadHash(hash);
            }
            else {
              $scope.disableSend = false;
              $scope.labelSend = false;
            }
          })
          .then(() => $scope.$apply());
          }, 1000);
        });
      };
      window.eztz.rpc.getHeadHash()
      .then(h => {
        if (h === ss.headHash) {
          $scope.disableSend = true;
          $scope.labelSend = true;
          recCheckHeadHash(ss.headHash);
        }
        else {
          $scope.disableSend = false;
          $scope.labelSend = false;
        }
      })
      .then(() => $scope.$apply());

      $scope.$apply();
    });
    $scope.send = function(){
        if (!$scope.amount || !$scope.toaddress) {
          alert("Please enter amount and a destination");
          return;
        }
        var keys = {};        
        keys.pk = ss.account.pk;
        keys.pkh = ss.account.tz1;//todo
        //breaks multiple accounts
        keys.sk = ss.secrets[0];
        $scope.sendError = false;
        $scope.sending = true;
        var am = $scope.amount * 1000000;
        am = am.toFixed(0);

        var operation = {
          "kind": "transaction",
          "amount": am, // This is in centiles, i.e. 100 = 1.00 tez
          "destination": $scope.toaddress,
          "parameters": ($scope.parameters ? eztz.utility.sexp2mic($scope.parameters) : $scope.parameters)
        };
        console.log(operation);
        console.log(keys);
        window.eztz.rpc.sendOperation(operation, keys, 0)
        .then((res) => {
          chrome.runtime.sendMessage({ method: "resolvedTransaction", data: res });
          return res;
        })
        .then($scope.endPayment)
        .catch((err) => {
          chrome.runtime.sendMessage({ method: "dismissedTransaction", data: err });
          return err;
        })
        .then($scope.endPayment);
    }
    $scope.endPayment = function(r){
      $scope.sending = false;
      if (typeof r.injectedOperation != 'undefined'){
        ss.pending.push({
          hash: r.injectedOperation,
          status: "pending",
          source: $scope.account.tz1,
          time: new Date().toISOString(),
          operations: [{
            destination: $scope.toaddress,
            amount: $scope.amount * 1000000,
            kind: "transaction"
          }]
        });

        //remove when batching is implemented
        window.eztz.rpc.getHeadHash()
        .then(h => {
          ss.headHash = h;
          Storage.setStore(ss);
          window.close();
        });
      } else {
        $scope.sendError = true;        
        window.close();
      }
    }
    $scope.cancel = function(){
      chrome.runtime.sendMessage({ method: "dismissedTransaction", data: "Transaction Canceled!" });
      window.close();
    }
}])
;
