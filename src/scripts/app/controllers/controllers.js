app.controller('CreateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    $scope.password = '';
    $scope.password2 = '';
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.create = function(){
        if (!$scope.password || !$scope.password2){
            alert("Please enter your password");
            return;
        }
        if ($scope.password.length < 8){
            alert("Your password is too short");
            return;
        }
        if ($scope.password != $scope.password2){
            alert("Passwords do not match");
            return;
        }
        window.showLoader();
        var identity = {
            temp : {
                mnemonic : $scope.mnemonic,
                password : $scope.password,
            },
            encryptedMnemonic : sjcl.encrypt($scope.password, $scope.mnemonic),
            accounts : [],
        };

        //Create free initial
        $scope.text = "Creating...";
        var keys = window.eztz.crypto.generateKeys(identity.temp.mnemonic, identity.temp.password);
        window.eztz.rpc.freeDefaultAccount(keys)
        .then(function(){
            identity.accounts.push({
                title: "Account 1",
                pkh: keys.pkh,
                pk: keys.pk
            });
            Storage.setStore(identity);
            $location.path("/main");
            $scope.$apply();
        })
        .catch(function(e){
            $scope.$apply(function(){
                $scope.title = "Error"
                $scope.text = e + "\nThe Tezos node might be busy. Please try again later.";
                $scope.password = '';
                $scope.password2 = '';
            });
        });
    };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', function($scope, $location, $http, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.encryptedMnemonic){
      //not set or not unlocked
         $location.path('/new');
    }
    $scope.editMode = false;
    $scope.accounts = ss.accounts;
    $scope.account = ss.accounts[0];
    $scope.accountDetails = {};
    $scope.lock = function(){
        ss.temp = {};
        Storage.setStore(ss);
        $location.path('/unlock');
    }
    var updateActive = function(){
      ss.account = {
        raw_balance : $scope.accountDetails.raw_balance,
        balance : $scope.accountDetails.balance,
        title : $scope.account.title,
        tz1 : $scope.account.pkh,
        pk : $scope.account.pk
      }
      Storage.setStore(ss);
    }
    $scope.save = function(){
        if (!$scope.account.title){
            alert("Please enter your address title");
            return;
        }
        var i = $scope.accounts.indexOf($scope.account);
        $scope.accounts[i] = $scope.account;
        ss.accounts = $scope.accounts;
        Storage.setStore(ss);
        $scope.refresh();
        $scope.editMode = false;
    };
    $scope.remove = function(){
      var i = $scope.accounts.indexOf($scope.account);
      $scope.accounts.splice(i, 1);
      $scope.account = $scope.accounts[0];
      $scope.refresh();
    };
    $scope.add = function(){
      var keys = window.eztz.crypto.generateKeys(ss.temp.mnemonic, ss.temp.password);
      window.showLoader();
      window.eztz.rpc.freeAccount(keys).then(function(r){
        $scope.$apply(function(){
          var i = $scope.accounts.length + 1;
          var an = "Account " + i;
          $scope.account = {
            title : an,
            pkh : r
          };
          $scope.accounts.push($scope.account);
          ss.accounts = $scope.accounts;
          Storage.setStore(ss);
          $scope.refresh();
        });
      });
    };
    $scope.loadAccount = function(a){
        $scope.account = a;
        $scope.accountDetails = {
            balance : "Loading...",
            usd : "Loading...",
        };
        window.eztz.rpc.getBalance(a.pkh)
        .then(function(r){
            var rb = parseInt(r);
            $scope.accountDetails.raw_balance = rb;
            bal = window.eztz.utility.mintotz(rb); 
            $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
            var usdbal = bal * 1.78;
            $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
            $scope.$apply();
            window.hideLoader();
            updateActive();
            window.jdenticon();
        });
    }
    $scope.refresh = function(){
        $scope.loadAccount($scope.account);
        
    };
    $scope.copy = function(){
        copyToClipboard($scope.account.pkh);
        alert("The address has been copied");
    };
    $scope.send = function(){
        window.account = $scope.account;
        $location.path('/send');
    };
    $scope.delegate = function(){
        window.account = $scope.account;
        $location.path('/delegate');
    };
    $scope.qr = function(){
        window.account = $scope.account;
        $location.path('/qr');
    };
    $scope.refresh();
    copyToClipboard = function(text) {
        if (window.clipboardData && window.clipboardData.setData) {
            // IE specific code path to prevent textarea being shown while dialog is visible.
            return clipboardData.setData("Text", text); 

        } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            } catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }}
}])
.controller('NewController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (ss && typeof ss.temp != 'undefined' && ss.temp.mnemonic && ss.temp.password){
        $location.path('/main');
    }  else if (ss && ss.encryptedMnemonic){
        $location.path('/unlock');
    }
    $scope.restore = function(){
        $location.path('/restore');
    };
    $scope.create = function(){
        $location.path('/create');
    };
    
}])
.controller('UnlockController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.encryptedMnemonic){
         $location.path('/new');
    }
    $scope.clear = function(){
        if (confirm("Are you sure you want to clear you TezBox - note, unless you've backed up your seed words you'll no longer have access to your accounts")){
        Storage.clearStore();
         $location.path('/new');
        }
    }
    $scope.unlock = function(){
        if (!$scope.password){
            alert("Please enter your password");
            return;
        }
        if ($scope.password.length < 8){
            alert("Your password is too short");
            return;
        }
        try {
            var mnemonic = sjcl.decrypt($scope.password, ss.encryptedMnemonic);
        } catch(err){
            console.log(err);
           alert("Incorrect password");
            return;
        }
        var identity = {
            temp : {
                mnemonic : mnemonic,
                password : $scope.password,
            },
            encryptedMnemonic : ss.encryptedMnemonic,
            accounts : ss.accounts,
        };
        Storage.setStore(identity);
        $location.path('/main');
    };
}])
.controller('RestoreController', ['$scope', '$location', function($scope, $location) {
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.restore = function(){
        //Load up things here
    };
}])
.controller('SendController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.sending = false;
    $scope.sendError = false;
    $scope.amount = 0;
    var ss = Storage.loadStore();
    if (!ss || !ss.encryptedMnemonic){
         $location.path('/new');
    }
    $scope.account = window.account;
    $scope.send = function(){
        if (!$scope.amount || !$scope.amount) {
          alert("Please enter amount and a destination");
          return;
        }
        var keys = window.eztz.crypto.generateKeys(ss.temp.mnemonic, ss.temp.password);
        keys.pkh = $scope.account.pkh;
        $scope.sendError = false;
        $scope.sending = true;
        var am = $scope.amount * 100;
        am = am.toFixed(0);
        
        var operation = {
          "kind": "transaction",
          "amount": am,
          "destination": $scope.toaddress,
          "parameters": ($scope.parameters ? eztz.utility.sexp2mic($scope.parameters) : $scope.parameters)
        };
        window.showLoader();
        window.eztz.rpc.sendOperation(operation, keys, 0).then($scope.endPayment);
    }
    $scope.endPayment = function(r){
        window.hideLoader();
        $scope.$apply(function(){
          $scope.sending = false;
          if (typeof r.injectedOperation != 'undefined'){
            $location.path('/main');
          } else {
            $scope.sendError = true;
          }
        });
    }
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
.controller('DelegateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.delegateType = '';
    $scope.delegate = '';
    $scope.account = window.account;
    window.showLoader();
    window.eztz.rpc.getDelegate($scope.account.pkh).then(function(r){
      window.hideLoader();
      $scope.delegate = r.delegate;
      if (r.delegate == 'tz1TwYbKYYJxw7AyubY4A9BUm2BMCPq7moaC' || r.delegate == 'tz1UsgSSdRwwhYrqq7iVp2jMbYvNsGbWTozp'){
        $scope.delegateType = r.delegate;
      }
      $scope.$apply(function(){});
    });
    
    $scope.sending = false;
    $scope.sendError = false;
    $scope.amount = 0;
    var ss = Storage.loadStore();
    if (!ss || !ss.encryptedMnemonic){
         $location.path('/new');
    }
    $scope.save = function(){
        if ($scope.delegateType) $scope.delegate = $scope.delegateType;
        if (!$scope.delegate) {
          alert("Please select a valid delegate");
          return;
        }
        var keys = window.eztz.crypto.generateKeys(ss.temp.mnemonic, ss.temp.password);
        keys.pkh = $scope.account.pkh;
        $scope.sendError = false;
        $scope.sending = true;
        window.showLoader();
        window.eztz.rpc.setDelegate(keys, $scope.account.pkh, $scope.delegate, 0).then($scope.end);
    }
    $scope.end = function(r){
        window.hideLoader();
        $scope.$apply(function(){
          $scope.sending = false;
          console.log(r);
          if (typeof r.injectedOperation != 'undefined'){
            $location.path('/main');
          } else {
            $scope.sendError = true;
          }
        });
    }
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
.controller('QrController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.account = window.account;
    $scope.cancel = function(){
        $location.path('/main');
    }
    $scope.copy = function(){
        copyToClipboard($scope.account.pkh);
        alert("The address has been copied");
    };
}])
;
