//Open Tab
chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("main.html") });
});

//Ledger integration
var ii = document.createElement('iframe');
ii.setAttribute('src', 'https://tezbox.com/ledger/');
ii.setAttribute('id', 'the_iframe');
document.body.appendChild(ii);
var ledgerIframe = document.getElementById('the_iframe');
var ledgerActions = {
  "sign" : false,
  "getAddress" : false,
  "trsign" : false,
  "trgetAddress" : false,
};
function ledgerBridge(action, data){
  return new Promise(function(resolve, reject){
    data.target = "LEDGER-IFRAME";
    data.action = action;
    ledgerActions[action] = [resolve, reject];
    ledgerIframe.contentWindow.postMessage(data, "*");
  });  
}
window.addEventListener("message", function(e){
  if (e && e.data && e.data.target === 'TEZBOX-EXT') {
    if (typeof e.data.success != 'undefined' && e.data.success){
      ledgerActions[e.data.action][0](e.data.data);      
    } else {
      ledgerActions[e.data.action][1](e.data.data);      
    }
    ledgerActions[e.data.action] = false;
  }
}, false);

//Trezor Integration
function initTezTrezor(){
  var device, interface, inep, outep, pbroot, isLoaded, pbError;

  function openDevice(){
    return new Promise(async function(resolve, reject){
      const VENDOR_ID = 4617
      const DEVICE_ID = 21441
    
      try {
        device = await navigator.usb.requestDevice({
          filters: [{
            vendorId: VENDOR_ID,
            deviceId: DEVICE_ID,
          }]
        })
        await device.open()

        if (device.configuration === null) {
          if (device.configurations.length <= 0) throw "No configurations";
          await device.selectConfiguration(devices.configurations[0].configurationValue)
        }

        if (device.configuration.interfaces.length <= 0) throw "No interfaces";
        interface = device.configuration.interfaces[0];
        await device.claimInterface(interface.interfaceNumber)

        if (interface.alternate.endpoints.length <= 0) throw "No endpoints";
        for(var i = 0; i < interface.alternate.endpoints.length; i++){
          if (interface.alternate.endpoints[i].direction == 'in' && !inep) inep = interface.alternate.endpoints[i].endpointNumber;
          if (interface.alternate.endpoints[i].direction == 'out' && !outep) outep = interface.alternate.endpoints[i].endpointNumber;
          if (inep && outep) break;
        }
        if (!inep || !outep) throw "Not enough endpoints found";
        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
  function closeDevice(){
    device.releaseInterface(interface).then(function(){
      device.close()
      device = false;
      interface = false;
      inep = false;
      outep = false;
      currentMessageData = false;
      currentMessageId = false;
      currentMessageLength = false;
      currentMessageHandler = false;
      currentMessageErrorHandler = false;
    });
  }
  function load(){
    return new Promise(function(resolve, reject){
      if (isLoaded){
        if (pbError){
          reject(pbError);
        } else {
          resolve();
        }
      } else {
        protobuf.load("skin/js/trezor/protob/trezor.tezos.proto", function(err, root) {
          if (err){
            pbError = err;
            isLoaded = true;
            reject(err);
          } else {
            pbroot = root;
            isLoaded = true;
            resolve();
          }
        });
      }
    });
  }

  tezFns = {
    sign : function(path, branch, operation, revealOp){
      return new Promise(function(resolve, reject){
        openDevice().then(function(){
          load().then(function(){
            var tx = {
              addressN : convertPath(path),
              branch : branch
            };
            if (revealOp ) tx.reveal = revealOp;
            var type = operation.type;
            delete operation.type;
            tx[type] = operation;
            trezorQuery('tezosSignTx', tx).then(function(d){
              closeDevice();
              if (typeof d.message != 'undefined' && d.message == 'Cancelled') reject('TREZOR_ERROR');
              else resolve(d);
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      });
    },
    getAddress: function(path){
      return new Promise(function(resolve, reject){
        openDevice().then(function(){
          load().then(function(){
            trezorQuery('tezosGetAddress', {
              addressN : convertPath(path),
              showDisplay : true,
            }).then(function(d){
              trezorQuery('tezosGetPublicKey', {
                addressN : convertPath(path),
                showDisplay : false,
              }).then(function(d1){
                closeDevice();
                resolve({
                  address : d.address,
                  publicKey : d1.publicKey
                });
              }).catch(reject);
            }).catch(reject);
          }).catch(reject);
        }).catch(reject);
      });
    }
  }
  
  //helper shared
  var trezToMsgid = {
    "tezosGetAddress" : 150,
    "tezosGetPublicKey" : 154,
    "tezosSignTx" : 152,	
    "acknowledge" : 27,
    "acknowledgePassphrase" : 42,
    "acknowledgePassphraseState" : 78,
  };
  var msgidToPb = {
    2 : "hw.trezor.messages.common.Success",
    3 : "hw.trezor.messages.common.Failure",
    26 : "hw.trezor.messages.common.ButtonRequest",
    27 : "hw.trezor.messages.common.ButtonAck",
    41 : "hw.trezor.messages.common.PassphraseRequest",
    42 : "hw.trezor.messages.common.PassphraseAck",
    77 : "hw.trezor.messages.common.PassphraseStateRequest",
    78 : "hw.trezor.messages.common.PassphraseStateAck",
    
    150 : "hw.trezor.messages.tezos.TezosGetAddress",
    151 : "hw.trezor.messages.tezos.TezosAddress",
    152 : "hw.trezor.messages.tezos.TezosSignTx",
    153 : "hw.trezor.messages.tezos.TezosSignedTx",
    154 : "hw.trezor.messages.tezos.TezosGetPublicKey",
    155 : "hw.trezor.messages.tezos.TezosPublicKey",
  };
  function convertPath(p){
    var ps = p.split('/');
    var r = [];
    for(var i = 0; i < ps.length; i++){
      r.push((ps[i].indexOf("'") >= 0 ? (parseInt(ps[i]) | 0x80000000) >>> 0 : parseInt(ps[i])));
    }
    return r;
  }
  function buildPackets(id, data){
    data = encodeProtobugMessage(id, data || {});	
    data = Array.prototype.slice.call(data, 0);
    var header = [35, 35];
    header = header.concat([id >> 8, id % 255]);
    header = header.concat(toBytesInt32(data.length));
    data = header.concat(data);
    var pak = [];
    var packets = [];
    for (var i = 0; i < Math.ceil((data.length)/63); i++){
      pak = data.slice(i * 63, (i * 63) + 63);
      pak = pad_array(pak, 63, 0);
      packets.push(pak);
    }
    return packets;
  }
  function pad_array(arr,len,fill) {
    return arr.concat(Array(len).fill(fill)).slice(0,len);
  }
  function encodeProtobugMessage(messageId, message){
    var pbm = pbroot.lookupType(msgidToPb[messageId]);
    return pbm.encode(message).finish();
  }
  function decodeProtobugMessage(messageId, message){
    var pbm = pbroot.lookupType(msgidToPb[messageId]);
    return pbm.toObject(pbm.decode(message));
  }
  function buf2int(b){
    var count = 0;
    for(var i = 0; i < b.length; i++){
      count = (count << 8) + b[i];
    }
    return count;
  }
  function toBytesInt32 (num) {
    return [
      (num & 0xff000000) >> 24,
      (num & 0x00ff0000) >> 16,
      (num & 0x0000ff00) >> 8,
      (num & 0x000000ff)
    ];
  }
  
  //web only
  function trezorQuery(id, data){
    return new Promise(async function(resolve, reject){
      var packets = buildPackets(trezToMsgid[id], data || false);
      for(var i = 0; i < packets.length; i++){
        await device.transferOut(outep, new Uint8Array([63].concat(packets[i])));
      }
      const timeoutID = setTimeout(function(){
        reject("Timeout");
      }, 120 * 1000)
      var  currentMessageData, currentMessageId, currentMessageLength;
      while (true) {
        var incoming = await device.transferIn(inep, 64);
        d = new Uint8Array(incoming.data.buffer);
        if (d[0] != 63) {
          reject("Bad message");
          clearTimeout(timeoutID);
          break;
        }
        d = d.slice(1);
        if (d[0] == 35 && d[1] == 35) {
          currentMessageId = buf2int(d.slice(2, 4));
          currentMessageLength = buf2int(d.slice(4, 8));
          d = d.slice(8);
          currentMessageData = [];
        }
        if (currentMessageId){
          currentMessageData = currentMessageData.concat(buf2array(d));
          if (currentMessageData.length >= currentMessageLength){
            if (currentMessageId == 26){
              trezorQuery("acknowledge").then(resolve).catch(reject);
            } else if (currentMessageId == 41){
              if (currentMessageData[1]){
                trezorQuery("acknowledgePassphrase").then(resolve).catch(reject);
              } else {
                var passphrase = prompt("Please enter your passpharse");
                if (passphrase != null) {
                  trezorQuery("acknowledgePassphrase", {
                    passphrase : passphrase
                  }).then(resolve);
                } else {
                  reject("Invalid passphrase");
                }
              }
            } else if (currentMessageId == 77){
              trezorQuery("acknowledgePassphraseState").then(resolve).catch(reject);
            } else {
              currentMessageData = currentMessageData.slice(0, currentMessageLength);
              resolve(decodeProtobugMessage(currentMessageId, new Uint8Array(currentMessageData)));
            }
            clearTimeout(timeoutID);
            break;
          }
        }
      }
    });
  }
  function buf2array(buf){
    var a = [];
    for(var i = 0; i < buf.length; i++){
      a.push(buf[i]);
    }
    return a;
  }
  return tezFns;
}
var teztrezor = initTezTrezor();

//TBAPI Integration
var pendingRequest = false, results = {};
function extractHostname(url) {
	var hostname;
	if (url.indexOf("//") > -1) {
		hostname = url.split('/')[2];
	} else {
		hostname = url.split('/')[0];
	}
	hostname = hostname.split(':')[0];
	hostname = hostname.split('?')[0];
	return hostname;
}
var getSender = function(s){
	if (typeof s.url != 'undefined') return extractHostname(s.url);
	else return false;
}

//Communication layer
chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
  if (request.action == 'tbapiResult'){
		results[request.method] = request.data;
		return false;
  } else if (request.action == 'tbapi') {
		var isWhitelisted = false, isBlacklisted = false, tbsettings = JSON.parse(localStorage.getItem('tbsetting')), tbstore = JSON.parse(localStorage.getItem('tbstore')), connectionError = {success:false, error:"Timeout or Communication error"};
		sender = getSender(sender);
		if (!tbstore || !tbsettings){
			sendResponse({success:false, error:"TezBox not setup"});	
			return false;
		}
		
		//Legacy support
		if (typeof tbsettings.whitelist == 'undefined') {
			tbsettings.whitelist = [];
			localStorage.setItem('tbsetting', JSON.stringify(tbsettings));
		}
		if (typeof tbsettings.blacklist == 'undefined') {
			tbsettings.blacklist = [];
			localStorage.setItem('tbsetting', JSON.stringify(tbsettings));
		}
		if (typeof tbsettings.allowApi == 'undefined') {
			tbsettings.allowApi = true;
			localStorage.setItem('tbsetting', JSON.stringify(tbsettings));
		}
		
		isWhitelisted = (tbsettings.whitelist.indexOf(sender) >= 0);
		isBlacklisted = (tbsettings.blacklist.indexOf(sender) >= 0);
		
		if (!tbsettings.allowApi) {
			sendResponse({success:false, error:"API mode disabled"});			
			return false;
		}
		if (pendingRequest) {
			sendResponse({success:false, error:"Awaiting pending request"});
			return false;
		}
		if (!sender) {
			sendResponse({success:false, error:"Invalid sender"});
			return false;
		}
		
		//Public methods
		if (isBlacklisted) {
			sendResponse({success:false, error:"Blacklisted"});			
			return false;
		}
		if (request.method == 'haveAccess'){
			sendResponse({success:isWhitelisted});	
			return false;
		}
		
		if (request.method == 'requestAccess'){
			if (isWhitelisted){
				sendResponse({success:true});	
				return false;
			} else {
				pendingRequest = true;
				results['access'] = connectionError;
				chrome.storage.local.set({ 
					'promptData': sender     
				});
				chrome.windows.create({'url': chrome.extension.getURL("access.html"), 'type': 'popup','width': 357, 'height': 510,}, function(w) {
					chrome.windows.onRemoved.addListener(function l(id) {
						if(id === w.id){
							pendingRequest = false;
							sendResponse(results['access']);
							results['access'] = '';
							chrome.windows.onRemoved.removeListener(l);
						}
					});          
				});
				return true;
			}
		} 
		
		//Secure methods
		if (!isWhitelisted){
			sendResponse({success:false, error:"Not whitelisted"});	
			return false;
		} 
		if (request.method == 'getActiveAccount'){
			sendResponse({success:true, data: tbstore.accounts[tbstore.account]});
			return false;
		} 
		if (request.method == 'getAllAccounts'){
			sendResponse({success:true, data: tbstore.accounts});			
			return false;
		} 
		if (request.method == 'initiateTransaction'){
			pendingRequest = true;
			results['transfer'] = connectionError;
			chrome.storage.local.set({ 
				'promptData': {}     
			});//todo
			chrome.windows.create({'url': chrome.extension.getURL("main.html"), 'type': 'popup','width': 357, 'height': 510,}, function(w) {
				chrome.windows.onRemoved.addListener(function l(id) {
					if(id === w.id){
						pendingRequest = false;
						sendResponse(results['transfer']);
						results['transfer'] = false;
						chrome.windows.onRemoved.removeListener(l);
					}
				});          
			});
			return true;
		} 
		if (request.method == 'signData'){
			pendingRequest = true;
			results['sign'] = connectionError;
			chrome.storage.local.set({ 
				'promptData': {}
			});//todo
			chrome.windows.create({'url': chrome.extension.getURL("sign.html"), 'type': 'popup','width': 357, 'height': 510,}, function(w) {
				chrome.windows.onRemoved.addListener(function l(id) {
					if(id === w.id){
						pendingRequest = false;
						sendResponse(results['sign']);
						results['sign'] = false;
						chrome.windows.onRemoved.removeListener(l);
					}
				});          
			});
			return true;
		}
	} else if (request.action == 'sign' || request.action == 'getAddress'){
    ledgerBridge(request.action, request.data)
    .then(function(r){
      sendResponse({success:true, data:r});
    })
    .catch(function(r){
      sendResponse({success:false, data:r});
    }); 
		return true;
  } else {
    var ac = request.action.substr(2);
    if (ac == 'sign'){
      teztrezor.sign(request.data.path, request.data.branch, request.data.operation, request.data.revealOp).then(function(r){
        sendResponse({success:true, data:r});
      }).catch(function(r){
        sendResponse({success:false, data:r});
      });
    } else {
      teztrezor.getAddress(request.data.path).then(function(r){
        sendResponse({success:true, data:r});
      }).catch(function(r){
        sendResponse({success:false, data:r});
      });
    }
		return true;
  }
});