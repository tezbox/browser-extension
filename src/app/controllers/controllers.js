app.controller('NewController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.setting = Storage.loadSetting();
    if (!$scope.setting) {
      $scope.setting = {
        rpc : "https://rpc.tezrpc.me",
        disclaimer : false
      };
      Storage.setSetting($scope.setting);
    }
    window.eztz.node.setProvider($scope.setting.rpc);
    
    var checkStore = function(){
      var ss = Storage.loadStore();
      if (ss && typeof Storage.keys.sk != 'undefined'){
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
.controller('CreateController', ['$scope', '$location', 'Storage', '$sce', function($scope, $location, Storage, $sce) {
    $scope.passphrase = '';
    $scope.mnemonic = '';
    $scope.cancel = function(){
        $location.path('/new');
    };
    $scope.newMnemonic = function(){
       $scope.mnemonic = window.eztz.crypto.generateMnemonic();
    }
    $scope.showSeed = function(m){
      var mm = m.split(" ");
      return $sce.trustAsHtml("<span>"+mm.join("</span> <span>")+"</span>");
    }
    $scope.newMnemonic();
    $scope.create = function(){
        var keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase);
        keys = {sk : keys.sk, pk : keys.pk, pkh : keys.pkh};
        var identity = {
            pkh : keys.pkh,
            accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
            account : 0,
            transactions : {},
        };
        Storage.setStore(identity, keys);
        $location.path("/validate");
    };
}])
.controller('ValidateController', ['$scope', '$location', 'Storage', '$sce', 'SweetAlert', function($scope, $location, Storage, $sce, SweetAlert) {
    var ss = Storage.loadStore();
    if (ss  && ss.ensk && typeof Storage.keys.sk != 'undefined'){
        $location.path('/main');
    }  else if (ss && ss.ensk){
        $location.path('/unlock');
    }
    $scope.cancel = function(){
        Storage.clearStore();
        $location.path('/new');
    };
    $scope.passphrase = '';
    $scope.mnemonic = '';
    $scope.validate = function(){
      var keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase);
      if (keys.pkh != ss.pkh) {
        SweetAlert.swal("Uh-oh!", "Sorry, those details do not match - please try again, or go back and create a new account again");
      } else {        
        $location.path("/encrypt");
      }
    };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', 'SweetAlert', function($scope, $location, $http, Storage, SweetAlert) {
    var protos = {
      "PtCJ7pwoxe8JasnHY8YonnLYjcVHmhiARPJvqcC6VfHT5s8k8sY" : "Betanet",
      "PsYLVpVvgbLhAhoqAkMFUo6gudkJ9weNXhUYCiLDzcUpFpkk8Wt" : "Betanet_v2"
    }
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk || typeof Storage.keys.sk == 'undefined'){
       $location.path('/new');
    }
    if (typeof ss.temp != 'undefined') delete ss.temp;
    
    
    $scope.setting = Storage.loadSetting();
    $scope.accounts = ss.accounts;
    $scope.account = ss.account;
    if (Storage.restored){
      window.showLoader();
      $http.get("https://betaapi.tezex.info/v2/tzx/account/"+$scope.accounts[0].address+"/originations").then(function(r){
        if (r.status == 200){
          if (r.data.originations.length > 0){
            SweetAlert.swal({
              title: "Import KT addresses",
              text: "We have found "+r.data.originations.length+" KT1 address(es) linked to your key - would you like to import them now? (You can also manually import these by going to Options > Import)",
              type : "info",
              showCancelButton: true,
              confirmButtonText: "Yes, import them!",
              closeOnConfirm: true
            },
            function(isConfirm){
              if (isConfirm){
                for(var i = 0; i < r.data.originations.length; i++){
                  $scope.accounts.push(
                    {
                      title : "Account " + ($scope.accounts.length),
                      address : JSON.parse(r.data.originations[i].new_account)[0]
                    }
                  );
                }
                ss.accounts = $scope.accounts;
                Storage.setStore(ss);
                $scope.refresh();
              }
              window.hideLoader();
            });
          } else {            
            window.hideLoader();
          }
        } else {
          window.hideLoader();
        }
      });
      if (Storage.ico) SweetAlert.swal("Awesome", "You have successfully restored your ICO wallet. If you have just activated your account, please note that this may take some time to show.");
      Storage.restored = false;
      Storage.ico = false;
    } else {
      window.hideLoader();
    }
    $scope.accountDetails = {};
    $scope.transactions = [];
    $scope.accountLive = true;
    
    $scope.tt = $scope.accounts[$scope.account].title;
    
    $scope.amount = 0;
    $scope.fee = 0;
    $scope.parameters = '';
    $scope.delegateType = '';
    $scope.dd = '';
    $scope.block = {
      net : "Loading..",
      level : "N/A",
      proto : "Loading",
    };
    refreshHash = function(){
      window.eztz.rpc.getHead().then(function(r){
        $scope.$apply(function(){
          $scope.block = {
            net : r.chain_id,
            level : r.header.level,
            proto : "Connected to " + protos[r.protocol],
          };
        });
      }).catch(function(e){
        $scope.$apply(function(){
          $scope.block = {
            net : "Error",
            level : "N/A",
            proto : "Not Connected",
          };
        });
      });
    }
    refreshHash();
    var ct = setInterval(refreshHash, 20000);
    
    $scope.viewSettings = function(){
        clearInterval(ct);
        $location.path('/setting');
    }
    $scope.lock = function(){
        clearInterval(ct);
        Storage.keys = {};
        $location.path('/unlock');
    }
    $scope.saveTitle = function(){
      if (!$scope.tt){
          SweetAlert.swal("Uh-oh!", "Please enter a new title");
          return;
      }
      $scope.accounts[$scope.account].title = $scope.tt;
      ss.accounts = $scope.accounts;
      Storage.setStore(ss);
      $scope.refresh();
    };
    $scope.kt1 = '';
    $scope.import = function(){
      if (!$scope.kt1) return SweetAlert.swal("Uh-oh!", "Please enter the KT1 address to import");
      for(var i = 0; i < $scope.accounts.length; i++){
        if ($scope.accounts[i].address == $scope.kt1) return SweetAlert.swal("Uh-oh!", "That address is already linked to your wallet!");
      }
      window.showLoader();
      
      window.eztz.node.query("/chains/main/blocks/head/context/contracts/"+$scope.kt1+"/manager").then(function(r){
        if (r != $scope.accounts[0].address) return SweetAlert.swal("Uh-oh!", "That contract is not managed by your account key");
        $scope.$apply(function(){
          $scope.accounts.push(
            {
              title : "Account " + ($scope.accounts.length),
              address : $scope.kt1
            }
          );
          $scope.account = ($scope.accounts.length-1);
          ss.accounts = $scope.accounts;
          ss.account = $scope.account;
          Storage.setStore(ss);
          $scope.refresh();
          $scope.kt1 = '';
          window.hideLoader();
        })
      }).catch(function(r){
        window.hideLoader();
        SweetAlert.swal("Uh-oh!", "There was an error importing that account");
      });
    };
    $scope.remove = function(){
      SweetAlert.swal({
        title: "Are you sure?",
        text: "You are about to remove this account from your wallet! (You can always restore this account in future by going to Options > Import)",
        type : "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it!",
        closeOnConfirm: true
      },
      function(isConfirm){
        if (isConfirm){
          $scope.accounts.splice($scope.account, 1);
          $scope.account = 0;
          ss.accounts = $scope.accounts;
          ss.account = $scope.account;
          Storage.setStore(ss);
          $scope.refresh();
        }
      });
    };
    $scope.add = function(){
      SweetAlert.swal({
        title: "Are you sure?",
        text: "Creating a new account incurs an origination fee of ~0.257 XTZ. Do you want to continue?)",
        type : "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, continue!",
        closeOnConfirm: true
      },
      function(isConfirm){
        if (isConfirm){
          var keys = Storage.keys;
          window.showLoader();      
          window.eztz.rpc.account(keys, 0, true, true, null, 0).then(function(r){
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
                SweetAlert.swal("Uh-oh!", "Error: awaiting existing origination to activate");
              }
              $scope.refresh();
              window.hideLoader();
            });
          }).catch(function(r){
            window.hideLoader();
            if (typeof r.errors !== 'undefined'){
                
              ee = r.errors[0].id.split(".").pop();
              SweetAlert.swal("Uh-oh!", r.error + ": Error (" + ee + ")");
            } else SweetAlert.swal("Uh-oh!", "There was an error adding account. Please ensure your main account has funds available");
          });
        }
      });
      
    };
    
    $scope.delegates = {
      keys : [
      'tz1iZEKy4LaAjnTmn2RuGDf2iqdAQKnRi8kY',
      'tz1TDSmoZXwVevLTEvKCTHWpomG76oC9S2fJ',
      'tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q',
      'tz1Tnjaxk6tbAeC2TmMApPh8UsrEVQvhHvx5',
      ],
      names : [
        'Tezzigator',
        'Tezos.Community',
        'HappyTezos',
        'CryptoDelegate',
      ]
    };
    
    $scope.loadAccount = function(a){
      $scope.account = a;
      ss.account = $scope.account
      $scope.tt = $scope.accounts[$scope.account].title;;
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
      if (a){
        window.eztz.rpc.getDelegate($scope.accounts[a].address).then(function(r){
          $scope.$apply(function(){
            $scope.dd = r;
            var ii = $scope.delegates.keys.indexOf($scope.dd);
            if (ii >= 0){
              $scope.delegateType = $scope.dd;
            } else 
              $scope.delegateType = '';
            
          });
        });
      }
      window.eztz.rpc.getBalance($scope.accounts[a].address).then(function(r){
        $scope.$apply(function(){
          $scope.accountLive = true;
          var rb = parseInt(r);
          bal = Math.floor(rb/10000)/100; 
          var usdbal = bal * 1.78;
          $scope.accountDetails.raw_balance = rb;
          $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
          $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
        });
      }).catch(function(e){
        $scope.$apply(function(){
          $scope.accountLive = false;
          var rb = parseInt(0);
          bal = Math.floor(rb/10000)/100; 
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
      SweetAlert.swal("Awesome!", "The address has been copied to your clipboard", "success");
      window.copyToClipboard($scope.accounts[$scope.account].address);
    };
    
    
    $scope.send = function(){
      if (!$scope.amount || !$scope.toaddress) return SweetAlert.swal("Uh-oh!", "Please enter amount and a destination");
      if ($scope.amount < 0) return SweetAlert.swal("Uh-oh!", "Invalid amount entered - please enter a positive number");
      if ($scope.fee < 0) return SweetAlert.swal("Uh-oh!", "Invalid amount entered - please enter a positive number");
      if ($scope.amount != parseFloat($scope.amount)) return SweetAlert.swal("Uh-oh!", "Invalid amount entered - please enter a valid number");
      if ($scope.fee != parseFloat($scope.fee)) return SweetAlert.swal("Uh-oh!", "Invalid amount entered - please enter a valid number");
      SweetAlert.swal({
        title: "Are you sure?",
        text: "You are about to send " + $scope.amount + "XTZ to " + $scope.toaddress + " - this transaction is irreversible",
        type : "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, send it!",
        closeOnConfirm: true
      },
      function(isConfirm){
        if (isConfirm){
          window.showLoader();
          var keys = {
            sk : Storage.keys.sk,
            pk : Storage.keys.pk,
            pkh : $scope.accounts[$scope.account].address,
          };
          if ($scope.parameters){
            var op = window.eztz.contract.send($scope.toaddress, $scope.accounts[$scope.account].address, keys, $scope.amount, $scope.parameters, $scope.fee);
          } else {
            var op = window.eztz.rpc.transfer($scope.accounts[$scope.account].address, keys, $scope.toaddress, $scope.amount, $scope.fee);
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
              SweetAlert.swal("Awesome!", "Transaction has been sent - this may take a few minutes to be included on the blockchain", "success");
              $scope.clear();
            });
          }).catch(function(r){
            $scope.$apply(function(){
              window.hideLoader();
              if (typeof r.errors !== 'undefined'){
                ee = r.errors[0].id.split(".").pop();
                SweetAlert.swal("Uh-oh!", "Operation Failed! " + r.error + ": Error (" + ee + ")");
              } else {
                SweetAlert.swal("Uh-oh!", "Operation Failed! Please check your inputs");
              }
            });
          });
          
        }
      });
    };
     $scope.clear = function(){
      $scope.amount = 0;
      $scope.fee = 0;
      $scope.toaddress = '';
      $scope.parameters = '';
    }
    $scope.updateDelegate = function(){
        if ($scope.delegateType) $scope.dd = $scope.delegateType;
        if (!$scope.dd) {
          SweetAlert.swal("Uh-oh!", "Please enter or a valid delegate");
          return;
        }
        window.showLoader();
        var keys = {
          sk : Storage.keys.sk,
          pk : Storage.keys.pk,
          pkh : $scope.accounts[$scope.account].address,
        };
        window.eztz.rpc.setDelegate($scope.accounts[$scope.account].address, keys, $scope.dd, 0).then(function(r){
          $scope.$apply(function(){
            SweetAlert.swal("Awesome!", "Delegation operation was successful - this may take a few minutes to update", "success");
            window.hideLoader();
          });
        }).catch(function(r){
          $scope.$apply(function(){
            SweetAlert.swal("Uh-oh!", "Delegation Failed");
            window.hideLoader();
          });
        });
    }
    $scope.refresh();
    
}])
.controller('SettingController', ['$scope', '$location', 'Storage', 'SweetAlert', function($scope, $location, Storage, SweetAlert) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk ||  typeof Storage.keys.sk == 'undefined'){
       $location.path('/new');
    }
    $scope.setting = Storage.loadSetting();
    $scope.privateKey = '';
    $scope.password = '';
    $scope.save = function(){
      Storage.setSetting($scope.setting);
      window.eztz.node.setProvider($scope.setting.rpc);
      $location.path('/main');
    }
    $scope.show = function(){
      if (!$scope.password) return SweetAlert.swal("Uh-oh!", "Please enter your password");
      if ($scope.password == Storage.password) {
         $scope.privateKey = Storage.keys.sk;
      } else { 
          SweetAlert.swal("Uh-oh!", "Incorrect password");
      }
    }
}])
.controller('UnlockController', ['$scope', '$location', 'Storage', 'SweetAlert', function($scope, $location, Storage, SweetAlert) {
    var ss = Storage.loadStore();
    if (!ss || !ss.ensk){
         $location.path('/new');
    } else if (ss && ss.ensk && typeof Storage.keys.sk != 'undefined'){
         $location.path('/main');
    }
    $scope.clear = function(){
      
      SweetAlert.swal({
        title: "Are you sure?",
        text: "You are about to clear you TezBox - note, unless you've backed up your seed words or private key you'll no longer have access to your accounts",
        type : "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, clear it!",
        closeOnConfirm: true
      },
      function(isConfirm){
        if (isConfirm){
          Storage.clearStore();
          $location.path('/new');
        }
      });
    }
    $scope.unlock = function(){
        if (!$scope.password) return SweetAlert.swal("Uh-oh!", "Please enter your password");
        if ($scope.password.length < 8) return SweetAlert.swal("Uh-oh!", "Your password is too short");
        window.showLoader();
        setTimeout(function(){
          $scope.$apply(function(){
            try {
              var sk = sjcl.decrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, ss.pkh, 30000, 512, 'sha512').toString(), ss.ensk);
              var c = window.eztz.crypto.extractKeys(sk);
            } catch(err){
                window.hideLoader();
                SweetAlert.swal("Uh-oh!", "Incorrect password");
                return;
            }
            Storage.keys = c;
            Storage.password = $scope.password;
            $location.path('/main');
          });
        }, 100);
    };
}])
.controller('EncryptController', ['$scope', '$location', 'Storage', 'SweetAlert', function($scope, $location, Storage, SweetAlert) {
    var ss = Storage.loadStore();
    if (ss  && ss.ensk && typeof Storage.keys.sk != 'undefined'){
        $location.path('/main');
    }  else if (ss && ss.ensk){
        $location.path('/unlock');
    }
    $scope.cancel = function(){
        Storage.clearStore();
        $location.path('/new');
    };
    $scope.password = '';
    $scope.password2 = '';
    $scope.encrypt = function(){
        if (!$scope.password || !$scope.password2) return SweetAlert.swal("Uh-oh!", "Please enter your password");
        if ($scope.password.length < 8) return SweetAlert.swal("Uh-oh!", "Your password is too short");
        if ($scope.password != $scope.password2) return SweetAlert.swal("Uh-oh!", "Passwords do not match");
        
        //Validate
        var spaces = $scope.password.match(/\s+/g),
        numbers = $scope.password.match(/\d+/g),
        uppers  = $scope.password.match(/[A-Z]/),
        lowers  = $scope.password.match(/[a-z]/),
        special = $scope.password.match(/[!@#$%\^&*\+]/);
      
        if (spaces !== null) return SweetAlert.swal("Uh-oh!", "Your password can't include any spaces");
        if (uppers === null || lowers === null) return SweetAlert.swal("Uh-oh!", "Please include at least one uppercase and lowercase letter in your password");
        if (special === null && numbers === null) return SweetAlert.swal("Uh-oh!", "Please include at least one special character (number or symbol) in your password");
        
        window.showLoader();
        setTimeout(function(){
          $scope.$apply(function(){
            var identity = {
                ensk : sjcl.encrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, Storage.keys.pkh, 30000, 512, 'sha512').toString(), Storage.keys.sk),
                pkh : Storage.keys.pkh,
                accounts : ss.accounts,
                account : ss.account,
                transactions : ss.transactions,
            };
            Storage.setStore(identity);
            Storage.password = $scope.password;            
            $location.path("/main");
          });
        }, 100);
    }
}])
.controller('RestoreController', ['$scope', '$location', 'Storage', 'SweetAlert', function($scope, $location, Storage, SweetAlert) {
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
        if (['seed', 'ico'].indexOf($scope.type) >= 0 && !$scope.seed) return SweetAlert.swal("Uh-oh!", "Please enter your seed words");
        if (['seed', 'ico'].indexOf($scope.type) >= 0 && !window.eztz.library.bip39.validateMnemonic($scope.seed)) return SweetAlert.swal("Uh-oh!", "Your seed words are not valid - please check to ensure you are not missing a word/letter, and you haven't included an extra space/line break");

        if ($scope.type == 'ico' && !$scope.ico_password) return SweetAlert.swal("Uh-oh!", "Please enter your passphrase");
        if ($scope.type == 'ico' && !$scope.email) return SweetAlert.swal("Uh-oh!", "Please enter your email from the ICO PDF");
        if ($scope.type == 'ico' && !$scope.address) return SweetAlert.swal("Uh-oh!", "Please enter your address/Public Key Hash from the ICO PDF");
        if ($scope.type == 'private' && !$scope.private_key) return SweetAlert.swal("Uh-oh!", "Please enter your private key");
        $scope.text = "Restoring...";
        if ($scope.type == 'seed'){
          var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.passphrase);          
        } else if ($scope.type == 'ico'){
          var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.email + $scope.ico_password);       
          if ($scope.address != keys.pkh) return SweetAlert.swal("Uh-oh!", "Your fundraiser details don't seem to match - please try again and ensure you are entering your details in correctly.");
        } else if ($scope.type == 'private'){
          var keys = window.eztz.crypto.extractKeys($scope.private_key);          
        }
        
        var keys = {sk : keys.sk, pk : keys.pk, pkh : keys.pkh};
        var identity = {
            pkh : keys.pkh,
            accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
            account : 0,
            transactions : {}
        };
        if ($scope.type == 'ico' && $scope.activation_code){
          window.showLoader(); 
          window.eztz.rpc.activate(keys.pkh, $scope.activation_code).then(function(){
            $scope.$apply(function(){
              window.hideLoader();    
              Storage.setStore(identity, keys);          
              SweetAlert.swal("Awesome!", "Activation was successful - please keep in mind that it may take a few minutes for your balance to show", "success");
              Storage.ico = true;
              Storage.restored = true;
              $location.path("/encrypt");
            });
          }).catch(function(e){
            $scope.$apply(function(){
              window.hideLoader();    
              return SweetAlert.swal("Uh-oh!", "Activation was unsuccessful - please ensure the code is right, or leave it blank if you have already activated it");
            });
          });
        } else {
          Storage.setStore(identity, keys);   
          Storage.restored = true;
          $location.path("/encrypt");
        }
    };
}])
;
