app.controller('CreateController', ['$scope', '$location', 'Storage', function($scope, $location, Storage) {
    $scope.mnemonic = window.eztz.generateMnemonic();
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
        var ns = {
            temp : {
                mnemonic : $scope.mnemonic,
                password : $scope.password,
            },
            encryptedMnemonic : sjcl.encrypt($scope.password, $scope.mnemonic),
            addresses : ['Address 1'],
        };
        Storage.setStore(ns);
        $location.path('/main');
    };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', function($scope, $location, $http, Storage) {
    
    var ss = Storage.loadStore();
    if (!ss || !ss.encryptedMnemonic){
         $location.path('/new');
    }
    $scope.editMode = false;
    $scope.addressIndex = ss.addresses[0];
    $scope.addresses = ss.addresses;
    $scope.address = {};
    $scope.lock = function(){
        ss.temp = {};
        Storage.setStore(ss);
         $location.path('/unlock');
    }
    $scope.save = function(){
        if (!$scope.address.title){
            alert("Please enter your address title");
            return;
        }
        var i = $scope.addresses.indexOf($scope.addressIndex);
        $scope.addresses[i] = '';
        if ($scope.addresses.indexOf($scope.address.title) >= 0){
            alert("Please use a unique address title");
            return;
        }
        $scope.addresses[i] = $scope.address.title;
        ss.addresses = $scope.addresses;
        $scope.addressIndex = $scope.addresses[i];
        Storage.setStore(ss);
        $scope.refresh();
        $scope.editMode = false;
    };
    $scope.add = function(){
        var i = ss.addresses.length + 1;
        var an = "Address " + i;
        ss.addresses.push(an);
        $scope.addresses = ss.addresses;
        $scope.addressIndex = ss.addresses[i-1];
        $scope.refresh();
        Storage.setStore(ss);
    };
    $scope.loadAddress = function(){
        var i = $scope.addresses.indexOf($scope.addressIndex);
        var keys = eztz.generateKeysFromSeedMulti(ss.temp.mnemonic, '', i);
        $scope.address = {
            title : $scope.addressIndex,
            balance : "Loading...",
            keys : keys,
        };
        $http({
            method: 'POST',
            url: 'https://tezos.ostraca.org//blocks/head/proto/context/contracts/'+keys.pkh+"/balance",
            data: '{}'
        }).then(function(r){
            console.log(r.data.ok);
            $scope.address.balance = r.data.ok.toFixed(2)+"ꜩ";
        });
    }
    $scope.refresh = function(){
        $scope.loadAddress();
    };
    $scope.copy = function(){
        copyToClipboard($scope.address.keys.pkh);
    };
    $scope.send = function(){
        $location.path('/send');
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
        var ns = {
            temp : {
                mnemonic : mnemonic,
                password : $scope.password,
            },
            encryptedMnemonic : ss.encryptedMnemonic,
            addresses : ss.addresses,
        };
        Storage.setStore(ns);
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
.controller('SendController', ['$scope', '$location', function($scope, $location) {
    $scope.send = function(){
        alert("Under Development");
    }
    $scope.cancel = function(){
        $location.path('/main');
    }
}])
;
