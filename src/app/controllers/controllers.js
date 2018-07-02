app.controller('CreateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    $scope.passphrase = '';
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.newMnemonic = function(){
       $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    }
    $scope.create = function(){
        $scope.text = "Creating...";
        var keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase);
        var identity = {
            temp : {sk : keys.sk, pk : keys.pk, pkh : keys.pkh},
            pkh : keys.pkh,
            accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
            account : 0,
            transactions : {},
        };
        Storage.setStore(identity);
        $location.path("/encrypt");
    };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', function($scope, $location, $http, Storage) {
    window.hideLoader();
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk || !ss.temp){
       $location.path('/new');
    }
    $scope.setting = Storage.loadSetting();
    
    $scope.editMode = false;
    $scope.accounts = ss.accounts;
    $scope.account = ss.account;
    $scope.transactions = [];
    $scope.accountLive = true;
    
    $scope.accountDetails = {};
    
    $scope.openTransaction = function(ophash) {
        chrome.tabs.create({url: "http://tzscan.io/" + ophash});
    };
     $scope.viewSettings = function(){
        $location.path('/setting');
    }
   $scope.lock = function(){
        delete ss.temp;
        Storage.setStore(ss);
        $location.path('/unlock');
    }
    $scope.save = function(){
      if (!$scope.accounts[$scope.account].title){
          alert("Please enter your address title");
          return;
      }
      ss.accounts = $scope.accounts;
      Storage.setStore(ss);
      $scope.refresh();
      $scope.editMode = false;
    };
    $scope.remove = function(){
      if (confirm("Are you sure you want to proceed with removing this account?")){
        $scope.accounts.splice($scope.account, 1);
        $scope.account = 0;
        $scope.refresh();
      }
    };
    $scope.add = function(){
      if (!confirm("Creating a new KT1 address will cost approx. ~0.25XTZ - do you want to continue?")) return;
      var keys = ss.temp;
      window.showLoader();      
      window.eztz.rpc.account(keys, 0, true, true, keys.pkh, 0).then(function(r){
        $scope.$apply(function(){
          var address = window.eztz.contract.hash(r.hash, 0);
          if ($scope.accounts[$scope.accounts.length-1].address != address){
            $scope.accounts.push(
              {
                title : "Account " + ($scope.accounts.length),
                address : address
              }
            );
            $scope.account = ($scope.accounts.length-1);
            ss.accounts = $scope.accounts;
            ss.account = $scope.account;
            Storage.setStore(ss);
          } else {
            alert("Error: awaiting existing origination to activate");
          }
          $scope.refresh();
          window.hideLoader();
        });
      }).catch(function(r){
        window.hideLoader();
        if (typeof r.errors !== 'undefined'){
            
          ee = r.errors[0].id.split(".").pop();
          alert(r.error + ": Error (" + ee + ")");
        } else alert("There was an error adding account. Please ensure your main account has funds available");
      });
    };
    $scope.loadAccount = function(a){
      $scope.account = a;
      ss.account = $scope.account
      Storage.setStore(ss);
      if (typeof ss.transactions[$scope.accounts[$scope.account].address] != 'undefined')
        $scope.transactions = ss.transactions[$scope.accounts[$scope.account].address];
      else
        $scope.transactions = [];
      $scope.accountDetails = {
          balance : "Loading...",
          usd : "Loading...",
          raw_balance : "Loading...",
      };
      window.eztz.rpc.getBalance($scope.accounts[a].address).then(function(r){
        $scope.$apply(function(){
          $scope.accountLive = true;
          var rb = parseInt(r);
          bal = eztz.utility.mintotz(rb); 
          var usdbal = bal * 1.78;
          $scope.accountDetails.raw_balance = rb;
          $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
          $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
        });
      }).catch(function(e){
        $scope.$apply(function(){
          $scope.accountLive = false;
          var rb = parseInt(0);
          bal = eztz.utility.mintotz(rb); 
          var usdbal = bal * 1.78;
          $scope.accountDetails.raw_balance = rb;
          $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
          $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
        });
      });
    }
    $scope.refresh = function(){
        $scope.loadAccount($scope.account);
    };
    $scope.copy = function(){
      alert("Copied to clipboard");
        window.copyToClipboard($scope.accounts[$scope.account].address);
    };
    $scope.send = function(){
        $location.path('/send');
    };
    $scope.delegate = function(){
        $location.path('/delegate');
    };
    $scope.qr = function(){
        $location.path('/qr');
    };
    $scope.refresh();
    
}])
.controller('NewController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.setting = Storage.loadSetting();
    if (!$scope.setting) $scope.setting = {
      rpc : "https://rpc.tezrpc.me",
      disclaimer : false
    };
    window.eztz.node.setProvider($scope.setting.rpc);
    
    var checkStore = function(){     
      var ss = Storage.loadStore();
      if (ss && typeof ss.temp != 'undefined' && ss.temp.sk && ss.temp.pk && ss.temp.pkh){
          $location.path('/main');
      }  else if (ss && ss.ensk){
          $location.path('/unlock');
      }
    };
    if ($scope.setting.disclaimer) {
      checkStore();
    }
    $scope.acceptDisclaimer = function(){
      $scope.setting.disclaimer = true;
      Storage.setSetting($scope.setting);
      checkStore();
    };
    $scope.restore = function(){
        $location.path('/restore');
    };
    $scope.create = function(){
        $location.path('/create');
    };
    
}])
.controller('SettingController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk || !ss.temp){
       $location.path('/new');
    }
    $scope.setting = Storage.loadSetting();

    $scope.save = function(){
      Storage.setSetting($scope.setting);
      window.eztz.node.setProvider($scope.setting.rpc);
      $location.path('/main');
    };
    
}])
.controller('UnlockController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (ss && ss.ensk && ss.temp && ss.temp.sk && ss.temp.pk && ss.temp.pkh){
         $location.path('/main');
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
        window.showLoader();
        setTimeout(function(){
          $scope.$apply(function(){
            try {
              var sk = sjcl.decrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, ss.pkh, 30000, 512, 'sha512').toString(), ss.ensk);
              var c = window.eztz.crypto.extractKeys(sk);
            } catch(err){
              window.hideLoader();
              alert("Incorrect password");
              return;
            }
            var identity = {
                temp : c,
                ensk : ss.ensk,
                pkh : ss.pkh,
                accounts : ss.accounts,
                account : ss.account,
                transactions : ss.transactions,
            };
            Storage.setStore(identity);
            $location.path('/main');
          });
        }, 100);
    };
}])
.controller('EncryptController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (ss  && ss.ensk && typeof ss.temp != 'undefined' && ss.temp.sk && ss.temp.pk && ss.temp.pkh){
        $location.path('/main');
    }  else if (ss && ss.ensk){
        $location.path('/unlock');
    }
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.password = '';
    $scope.password2 = '';
    $scope.encrypt = function(){
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
        setTimeout(function(){
          $scope.$apply(function(){
            var identity = {
                temp : ss.temp,
                ensk : sjcl.encrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, ss.temp.pkh, 30000, 512, 'sha512').toString(), ss.temp.sk),
                pkh : ss.temp.pkh,
                accounts : ss.accounts,
                account : 0,
                transactions : ss.transactions,
            };
            Storage.setStore(identity);          
            $location.path("/main");
          });
        }, 100);
    }
}])
.controller('RestoreController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.type = 'seed'; //seed/private_key/ico

    $scope.seed = '';
    $scope.passphrase = '';
    $scope.private_key = '';
    $scope.email = '';
    $scope.ico_password = '';
    $scope.activation_code = '';
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.restore = function(){
        if ($scope.type == 'seed' && !$scope.seed) return alert("Please enter your seed words");
        if ($scope.type == 'ico' && !$scope.seed) return alert("Please enter your seed words");
        if ($scope.type == 'ico' && !$scope.ico_password) return alert("Please enter your passphrase");
        if ($scope.type == 'ico' && !$scope.email) return alert("Please enter your email from the ICO PDF");
        if ($scope.type == 'private' && !$scope.private_key) return alert("Please enter your private key");
        $scope.text = "Restoring...";
        if ($scope.type == 'seed'){
          var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.passphrase);          
        } else if ($scope.type == 'ico'){
          var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.email + $scope.ico_password);          
        } else if ($scope.type == 'private'){
          var keys = window.eztz.crypto.extractKeys($scope.private_key);          
        }
        var identity = {
            temp : {sk : keys.sk, pk : keys.pk, pkh : keys.pkh},
            pkh : keys.pkh,
            accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
            account : 0,
            transactions : {}
        };
        if ($scope.type == 'ico' && $scope.activation_code){
          window.showLoader(); 
          window.eztz.rpc.activate(identity.temp, $scope.activation_code).then(function(){
            $scope.$apply(function(){
              window.hideLoader();    
              Storage.setStore(identity);          
              $location.path("/encrypt");
            });
          }).catch(function(e){
            $scope.$apply(function(){
              window.hideLoader();    
              Storage.setStore(identity);          
              $location.path("/encrypt");
            });
          });
        } else {
          Storage.setStore(identity);          
          $location.path("/encrypt");
        }
    };
}])
.controller('SendController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (!ss.temp.sk || !ss.temp.pkh || !ss.temp.pk){
         $location.path('/restore');
    }
    $scope.accounts = ss.accounts;
    $scope.account = ss.account;
    $scope.sending = false;
    $scope.sendError = false;
    $scope.amount = 0;
    $scope.fee = 0;
    $scope.parameters = '';
    $scope.send = function(){
      $scope.sendError = false;
      if (!$scope.amount || !$scope.toaddress) {
        $scope.sendError = "Please enter amount and a destination";
        return;
      }
      if (!confirm("Are you sure you want to send " + parseFloat($scope.amount) + "XTZ to " + $scope.toaddress + " with fee " + parseFloat($scope.fee) + "?")) return;
      window.showLoader();
      $scope.sending = true;
      var keys = {
        sk : ss.temp.sk,
        pk : ss.temp.pk,
        pkh : $scope.accounts[$scope.account].address,
      };
      if ($scope.parameters){
        var op = window.eztz.contract.send($scope.toaddress, $scope.accounts[$scope.account].address, keys, parseFloat($scope.amount), $scope.parameters, parseFloat($scope.fee));
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
          $scope.sending = false;
          $location.path('/main');
        });
      }).catch(function(r){
        $scope.$apply(function(){
          $scope.sending = false;
          window.hideLoader();
          if (typeof r.errors !== 'undefined'){
            ee = r.errors[0].id.split(".").pop();
            $scope.sendError = "Operation Failed! " + r.error + ": Error (" + ee + ")";
          } else {
            $scope.sendError = "Operation Failed! Please check your inputs";
          }
        });
      });
    };
     $scope.clear = function(){
      $scope.amount = 0;
      $scope.fee = 0;
      $scope.toaddress = '';
      $scope.parameters = '';
    }
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
.controller('DelegateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (!ss.temp.sk || !ss.temp || !ss.temp.pkh || !ss.temp.pk){
         $location.path('/restore');
    }
    $scope.accounts = ss.accounts;
    $scope.account = ss.account;
    
    $scope.delegateType = '';
    $scope.delegate = '';
    $scope.bakeaddresses = ['tz1Tnjaxk6tbAeC2TmMApPh8UsrEVQvhHvx5',
    'tz1iZEKy4LaAjnTmn2RuGDf2iqdAQKnRi8kY',
    'tz1TDSmoZXwVevLTEvKCTHWpomG76oC9S2fJ',
    ]
    $scope.bakers = [{
      address : 'tz1Tnjaxk6tbAeC2TmMApPh8UsrEVQvhHvx5',
      name : "CryptoDelegate"
    },
    {
      address : "tz1iZEKy4LaAjnTmn2RuGDf2iqdAQKnRi8kY",
      name : "Tezzigator",
    },
    {
      address : "tz1TDSmoZXwVevLTEvKCTHWpomG76oC9S2fJ",
      name : "Tezos.Community",
    }];
    window.eztz.rpc.getDelegate($scope.accounts[$scope.account].address).then(function(r){
      $scope.$apply(function(){
        $scope.delegate = r;
        if ($scope.bakeaddresses.indexOf(r) >= 0){
          $scope.delegateType = r;
        }
      });
    });
    
    $scope.sending = false;
    $scope.sendError = false;
    $scope.save = function(){
        if ($scope.delegateType) $scope.delegate = $scope.delegateType;
        if (!$scope.delegate) {
          $scope.sendError = "Please select a valid delegate";
          return;
        }
        window.showLoader();
        var keys = {
          sk : ss.temp.sk,
          pk : ss.temp.pk,
          pkh : $scope.accounts[$scope.account].address,
        };
        $scope.sendError = '';
        $scope.sending = true;
       window.eztz.rpc.setDelegate($scope.accounts[$scope.account].address, keys, $scope.delegate, 0).then(function(r){
          $scope.$apply(function(){
            $scope.sending = false;
            window.hideLoader();
            $location.path('/main');
          });
        }).catch(function(r){
          $scope.$apply(function(){
            $scope.sending = false;
            window.hideLoader();
            ee = r.errors[0].id.split(".").pop();
          $scope.sendError = r.error + ": Error (" + ee + ")";
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
    $scope.accounts = ss.accounts;
    $scope.account = ss.account;
    $scope.copy = function(){
        window.copyToClipboard($scope.accounts[$scope.account].address);
        alert("Copied to clipboard");
    };
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
;
