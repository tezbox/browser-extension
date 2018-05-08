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
    if (!ss || !ss.seed){
      //not set or not unlocked
         $location.path('/new');
    }
    $scope.editMode = false;
    $scope.accounts = ss.accounts;
    $scope.account = ss.accounts[0];
    $scope.accountDetails = {};
    $scope.openTransaction = function(ophash) {
        console.log(ophash);
        chrome.tabs.create({url: "https://tezex.info/transaction/" + ophash});
    };
    var updateHistory = function(address, pending) {
    	return fetch("https://betaapi.tezex.info/v2/account/" + address + "/transactions/outgoing")
		.then(r => r.text())
		.then(r => JSON.parse(r))
		.then(r => {
			//console.log(r);
			let newpending = [];
			for (let i of pending) {
				// console.log(i);
				for (let j of r) {
					if (i.hash === j.hash) {
						i.status = "done";
					}
				}
				if (i.status === "pending") {
					newpending.push(i);
				}
			}
			console.log("updated pending");
			console.log(newpending);
			ss.pending = newpending;
	        Storage.setStore(ss);
			newpending.push(...r);
			console.log("complete history");
			console.log(newpending);
			return newpending;
		})
		.then(h => {
			return fetch("https://betaapi.tezex.info/v2/account/" + address + "/transactions/incoming")
			.then(r => r.text())
			.then(r => JSON.parse(r))
			.then(r => {
				h.push(...r);
				return h;
			});
		})
		.then(h => h.sort((a, b) => {
    		if (a.time > b.time)
    			return -1;
    		else
    			return 1;
    	}));
    };
    var parseHistory = function(h) {
    	let parsed = [];
    	for (let batch of h) {
    		for (let op of batch.operations) {
    			if (op.kind === "transaction"){
    				op = {...op,
    					hash: batch.hash,
    					status: (batch.status === "pending" ? "pending" : "done"),
    					direction: (batch.source === $scope.account.pkh ? ">>" : "<<"),
                        address: (batch.source === $scope.account.pkh ? op.destination : batch.source)
    				};
    				parsed.push(op);
    			}
    		}
    	}
    	return parsed;
    };
    $scope.lock = function(){
        ss.temp = {};
        Storage.setStore(ss);
        $location.path('/unlock');
    };
    var updateActive = function(){
      ss.account = {
        raw_balance : $scope.accountDetails.raw_balance,
        balance : $scope.accountDetails.balance,
        title : $scope.account.title,
        tz1 : $scope.account.pkh,
        pk : $scope.account.pk
      }
      Storage.setStore(ss);
    };
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
            var bal = window.eztz.utility.mintotz(rb); 
            $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 6, '.', ',')+"ꜩ";
            var usdbal = bal * 1.78;
            $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 6, '.', ',')+"USD";
            updateHistory($scope.account.pkh, ss.pending)
		    .then(h => parseHistory(h))
		    .then(h => {
		    	$scope.history = h;
		    })
		    .then(() => $scope.$apply());
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
        }
    };
}])
.controller('NewController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    var ss = Storage.loadStore();
    if (ss && ss.seed) {
        $location.path('/main');
    }
    else {	
		// window.eztz.utility.b58decode("edsk35uM4amkh1KRFZZkZMNnSE5DZ5EwjH81VbzCxdxzVJytG1AbKd", window.eztz.prefix.edsk);
    	fetch('https://faucet.smartcontractlabs.ee/')
        .then(r => r.text())
    	.then(r => window.eztz.utility.b58cdecode(r, window.eztz.prefix.edsk))
    	.then(function (s) {
    		var kp = window.eztz.library.sodium.crypto_sign_seed_keypair(s);
    		var identity = {
                seed : s,
                accounts : [],
                secrets : [],
                // pending : [{"branch":"BKiSoEtNHDUdomYhb4GTM7kbjSfSNhpzdtrxzFDLx6ZNZe4ALy7","counter":403,"fee":1,"status":"pending","hash":"oomWvo48JxUxymw7gGkbBDVaPCgXMaYSj9KKFuAh7MYZMxz4pm7","level":28824,"operations":[{"kind":"reveal","public_key":"edpku8vKEfzDSShWqncTEuhhKz63oVRT9ESnjCscjg7YLVbaF6D8fd"},{"amount":"4000000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1d1avKvyYmn2eAw787nw6hbc2F4qyPVaZh","time":"2018-05-07T17:43:00.000Z"},{"branch":"BKiYSB5y3m3E4PBD48xT2RrJHHvmA6QgABZEph3t81jtg5kpDrh","counter":402,"fee":1,"hash":"opCmy9i1mWdNX3s31k4NBB1UE3RfVnejKGPq7FXoxeLEioyjAfD","level":28822,"operations":[{"kind":"reveal","public_key":"edpku8vKEfzDSShWqncTEuhhKz63oVRT9ESnjCscjg7YLVbaF6D8fd"},{"amount":"3000000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1d1avKvyYmn2eAw787nw6hbc2F4qyPVaZh","time":"2018-05-07T17:41:00.000Z"},{"branch":"BKiKj5yFZDoLsABUFKN6dVgeDtEPugLrmyPRxUUY2QPmiR6XkRd","counter":401,"fee":1,"hash":"oo2JBpkDZjWEPJk461HztY7QzcMDKc6RRVhTvQ427yKQDEDo8V6","level":28820,"operations":[{"kind":"reveal","public_key":"edpku8vKEfzDSShWqncTEuhhKz63oVRT9ESnjCscjg7YLVbaF6D8fd"},{"amount":"3000000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1d1avKvyYmn2eAw787nw6hbc2F4qyPVaZh","time":"2018-05-07T17:39:00.000Z"},{"branch":"BKiiZrvfzmUuFMLZhHhJhXCdpZmKrR182c2HDFDGRZ3YfX63RJi","counter":399,"fee":1,"hash":"ooTXgX1pcH5KmmrNKWMPfiZtyouyq5o14cmjzuSS4A9Y6H1dfZn","level":28665,"operations":[{"kind":"reveal","public_key":"edpku8vKEfzDSShWqncTEuhhKz63oVRT9ESnjCscjg7YLVbaF6D8fd"},{"amount":"11000000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1d1avKvyYmn2eAw787nw6hbc2F4qyPVaZh","time":"2018-05-07T15:03:00.000Z"},{"branch":"BKiNBbzzEHkY2W6Myir8xRehqZMPZfn6jdQ99McMTgFSG7FxAZk","counter":398,"fee":50001,"hash":"onyDwdS3RSfD74uqFz4uRSXdDi7qjer1oSMYuEhaWSxwtNZ35hH","level":28656,"operations":[{"kind":"reveal","public_key":"edpku8vKEfzDSShWqncTEuhhKz63oVRT9ESnjCscjg7YLVbaF6D8fd"},{"amount":"13000000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1d1avKvyYmn2eAw787nw6hbc2F4qyPVaZh","time":"2018-05-07T14:54:00.000Z"},{"branch":"BKifZJyyP6T4GKTFmPNiKUfX6TVQocY52r5SjAHAbKDtppGriSV","counter":194,"fee":50001,"hash":"op2Diqe87E5iQNXvPSB9jxUTsc4TtkjoR7x7VPfE6HPFwEqfpUZ","level":5669,"operations":[{"kind":"reveal","public_key":"edpktwgsYACQGqSrKuA4eXbRPj8SS43DAL3VSmjcmV3Cs1bRYy74XN"},{"amount":"100000","destination":"tz1KwU6kuhBRtLELH3hFNmXe9o6xZYS171uL","kind":"transaction"}],"source":"tz1cAp6B3vQwUaAg6m8Z3JKnPjzryWvnvzn2","time":"2018-04-21T11:34:10.000Z"}]
                pending : []
            };
            identity.accounts.push({
                title: "Account 1",
		        pk: window.eztz.utility.b58cencode(kp.publicKey, window.eztz.prefix.edpk),
		        pkh: window.eztz.utility.b58cencode(window.eztz.library.sodium.crypto_generichash(20, kp.publicKey), window.eztz.prefix.tz1)
            });
            identity.secrets.push(window.eztz.utility.b58cencode(kp.privateKey, window.eztz.prefix.edsk));
            Storage.setStore(identity);
            $location.path("/main");
            $scope.$apply();
    	})
    }
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
    if (!ss || !ss.seed){
         $location.path('/new');
    }
    $scope.account = window.account;
    $scope.send = function(){
        if (!$scope.amount || !$scope.amount) {
          alert("Please enter amount and a destination");
          return;
        }
        var keys = {};
        keys.pk = $scope.account.pk
        keys.pkh = $scope.account.pkh;
        //breaks multiple accounts
        keys.sk = ss.secrets[0];
        $scope.sendError = false;
        $scope.sending = true;
        var am = $scope.amount * 1000000;
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
          	ss.pending.push({
          		hash: r.injectedOperation,
          		status: "pending",
          		source: $scope.account.pkh,
          		time: new Date().toISOString(),
          		operations: [{
          			destination: $scope.toaddress,
	          		amount: $scope.amount * 1000000,
	          		kind: "transaction"
          		}]          		
          	});
            Storage.setStore(ss);
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
