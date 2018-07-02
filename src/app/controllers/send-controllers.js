app.controller('SendController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.sending = false;
    $scope.sendError = false;
    $scope.amount = 0;
    $scope.balance = "Loading...";
    var ss;
    chrome.storage.local.get("transferData", function (result) {
      $scope.$apply(function(){
        ss = result.transferData.tb;
        if (!ss || !ss.ensk){
             window.close();
        } else if (!ss.temp.sk || !ss.temp.pkh || !ss.temp.pk){
             window.close();
        }
        
        var pay = result.transferData.transfer;
        $scope.toaddress = pay.destination;
        $scope.amount = pay.amount;
        $scope.parameters = pay.parameters;
        
        
        $scope.accounts = ss.accounts;
        $scope.account = ss.account;
        
        window.eztz.rpc.getBalance($scope.accounts[$scope.account].address).then(function(r){
          $scope.$apply(function(){
            var rb = parseInt(r);
            bal = eztz.utility.mintotz(rb); 
            $scope.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
          });
        }).catch(function(e){
          $scope.$apply(function(){
            var rb = parseInt(0);
            bal = eztz.utility.mintotz(rb); 
            $scope.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
          });
        });
      });
    });
    
    $scope.send = function(){
      window.showLoader();
      var keys = {
        sk : ss.temp.sk,
        pk : ss.temp.pk,
        pkh : $scope.accounts[$scope.account].address,
      };
    
      if ($scope.parameters){
        var op = window.eztz.contract.send($scope.toaddress, $scope.accounts[$scope.account].address, keys, $scope.amount, $scope.parameters, $scope.fee);
      } else {
        var op = window.eztz.rpc.transfer($scope.accounts[$scope.account].address, keys, $scope.toaddress, parseFloat($scope.amount), parseFloat($scope.fee));
      }
      op.then(function(r){
        $scope.$apply(function(){
          if (typeof ss.transactions[$scope.accounts[$scope.account].address] == 'undefined')
            ss.transactions[$scope.accounts[$scope.account].address] = [];
          
          var myDate = new Date();
          var month=new Array();
          month[0]="Jan";
          month[1]="Feb";
          month[2]="Mar";
          month[3]="Apr";
          month[4]="May";
          month[5]="Jun";
          month[6]="Jul";
          month[7]="Aug";
          month[8]="Sep";
          month[9]="Oct";
          month[10]="Nov";
          month[11]="Dec";
          var hours = myDate.getHours();
          var minutes = myDate.getMinutes();
          var ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12;
          minutes = minutes < 10 ? '0'+minutes : minutes;
          var strTime = hours + ':' + minutes;
          ss.transactions[$scope.accounts[$scope.account].address].unshift({
            hash: r.hash,
            to: $scope.toaddress,
            date: myDate.getDate()+" "+month[myDate.getMonth()]+" "+myDate.getFullYear()+" "+strTime,
            amount: $scope.amount	
          });
           Storage.setStore(ss);
          window.hideLoader();
          chrome.runtime.sendMessage({ method: "resolvedTransaction", data: r });
          window.close();
        });
      }).catch(function(r){
        $scope.$apply(function(){
          if (typeof r.errors !== 'undefined'){
            ee = r.errors[0].id.split(".").pop();
            err = "Operation Failed! " + r.error + ": Error (" + ee + ")";
          } else {
            err = "Operation Failed! Please check your inputs";
          }
          window.hideLoader();
          chrome.runtime.sendMessage({ method: "dismissedTransaction", data: err });
          window.close();
        });
      });
    };
    $scope.cancel = function(){
      chrome.runtime.sendMessage({ method: "dismissedTransaction", data: "Transaction Cancelled!" });
      window.close();
    }
}])
;
