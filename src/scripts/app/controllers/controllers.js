app.controller('CreateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    $scope.password = '';
    $scope.password2 = '';
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.newMnemonic = function(){
       $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    }
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
        //Create free initial
        $scope.text = "Creating...";
        var keys = window.eztz.crypto.generateKeys($scope.mnemonic);
        var identity = {
            temp : {sk : keys.sk, pk : keys.pk, pkh : keys.sk},
            ensk : sjcl.encrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, '', 10, 32, 'sha512').toString(), keys.sk),
            accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
            currentAccount : {}
        };
        Storage.setStore(identity);
        $location.path("/main");
    };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', function($scope, $location, $http, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk || !ss.temp){
       $location.path('/new');
    }
    $scope.editMode = false;
    $scope.accounts = ss.accounts;
    $scope.account = 0;
    $scope.accountDetails = {};
    $scope.lock = function(){
        ss.temp = '';
        Storage.setStore(ss);
        $location.path('/unlock');
    }
    var updateActive = function(){
      ss.currentAccount = {
        raw_balance : $scope.accountDetails.raw_balance,
        balance : $scope.accountDetails.balance,
        title : $scope.accounts[$scope.account].title,
        tz1 : $scope.accounts[$scope.account].pkh,
        pk : $scope.accounts[$scope.account].pk
      }
      Storage.setStore(ss);
    }
    $scope.save = function(){
      if (!$scope.accounts[$scope.account].title){
          alert("Please enter your address title");
          return;
      }
      console.log($scope.accounts);
      ss.accounts = $scope.accounts;
      Storage.setStore(ss);
      $scope.refresh();
      $scope.editMode = false;
    };
    $scope.remove = function(){
      $scope.accounts.splice($scope.account, 1);
      $scope.account = $scope.accounts[0];
      $scope.refresh();
    };
    $scope.add = function(){
      var keys = ss.temp;
      window.eztz.rpc.account(keys, 0, true, true, keys.pkh, 0).then(function(r){
        console.log(r);
      });
    };
    $scope.loadAccount = function(a){
        $scope.account = a;
        $scope.accountDetails = {
            balance : "Loading...",
            usd : "Loading...",
        };
        console.log(a);
        console.log($scope.accounts);
        console.log($scope.accounts[a].address);
        window.eztz.rpc.getBalance($scope.accounts[a].address).then(function(r){
          $scope.$apply(function(){
            console.log(r);
            var rb = parseInt(r);
            $scope.accountDetails.raw_balance = rb;
            bal = eztz.utility.mintotz(rb); 
            $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
            var usdbal = bal * 1.78;
            $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
            updateActive();
            window.jdenticon();
          });
        });
    }
    $scope.refresh = function(){
        $scope.loadAccount($scope.account);
    };
    $scope.copy = function(){
        copyToClipboard($scope.accounts[$scope.account].address);
    };
    $scope.send = function(){
        window.account = $scope.accounts[$scope.account];
        $location.path('/send');
    };
    $scope.delegate = function(){
        window.account = $scope.accounts[$scope.account];
        $location.path('/delegate');
    };
    $scope.qr = function(){
        window.account = $scope.accounts[$scope.account];
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
    if (ss && typeof ss.temp != 'undefined' && ss.temp.sk && ss.temp.pk && ss.temp.pkh){
        $location.path('/main');
    }  else if (ss && ss.ensk){
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
    if (!ss || !ss.ensk){
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
            var sk = sjcl.decrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, '', 10, 32, 'sha512').toString(), ss.ensk);
        } catch(err){
            console.log(err);
           alert("Incorrect password");
            return;
        }
        var identity = {
            temp : window.eztz.crypto.extractKeys(sk),
            ensk : ss.ensk,
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
        var keys = ss;
        keys.pkh = $scope.account.address;
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
        window.eztz.rpc.sendOperation(operation, keys, 0).then($scope.endPayment);
    }
    $scope.endPayment = function(r){
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
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (!ss.temp.sk || !ss.temp.pkh || !ss.temp.pk){
         $location.path('/restore');
    }
    $scope.account = window.account;
    
    $scope.delegateType = '';
    $scope.delegate = '';
    if (typeof $scope.account.public_key != 'undefined') delegatable = false;
    else delegatable = true;
    window.eztz.node.query('/chains/main/blocks/head/context/contracts/'+$scope.account.pkh+'/delegate').then(function(r){
      console.log(r);
      $scope.delegate = r;
      if (r == 'tz1TwYbKYYJxw7AyubY4A9BUm2BMCPq7moaC' || r == 'tz1UsgSSdRwwhYrqq7iVp2jMbYvNsGbWTozp'){
        $scope.delegateType = r;
      }
      $scope.$apply(function(){});
    });
    
    $scope.sending = false;
    $scope.sendError = '';
    $scope.save = function(){
        if (!delegatable) return;
        if ($scope.delegateType) $scope.delegate = $scope.delegateType;
        if (!$scope.delegate) {
          alert("Please select a valid delegate");
          return;
        }
        var keys = {
          sk : ss.temp.sk,
          pk : ss.temp.pk,
          pkh : $scope.account.address,
        };
        $scope.sendError = '';
        $scope.sending = true;
        window.eztz.rpc.setDelegate(keys, $scope.account.address, $scope.delegate, 0).then(function(r){
            console.log(r);
          $scope.$apply(function(){
            $scope.sending = false;
            $location.path('/main');
          });
        }).catch(function(r){
          console.log(r);
          $scope.$apply(function(){
            $scope.sending = false;
            $scope.sendError = r.error + " (" + r.errors[0].id + ")";
          });
        });
    }
    $scope.end = 
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
.controller('QrController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (!ss.temp.sk || !ss.temp.pkh || !ss.temp.pk){
         $location.path('/restore');
    }
    $scope.account = window.account;

    console.log(window.account);
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
;
