app.service('Storage', function() {
  var r = {};
  r.loaded = false;
  r.data = false;
  r.settings = {};
  
  r.keys = {};
  r.password = '';
  r.restored = false;
  r.ico = false;
  
  r.load = function(){
    if (!r.loaded){
      r.loadSetting();
      r.loadStore();
      r.loaded = true;
    }
  }
  r.loadStore = function(){
    var dd = JSON.parse(localStorage.getItem('tbstore'));
    if (dd){
      r.data = dd;            
    }
    return r.data;
  };
  r.setStore = function(v, k, p){
      r.data = v;
      if (typeof k != 'undefined') r.keys = k;
      if (typeof p != 'undefined') r.password = p;
      localStorage.setItem('tbstore', JSON.stringify(v));
  };
  r.clearStore = function(){
    r.keys = {};
    r.password = '';
    r.restored = false;
    r.ico = false;
    r.data = false;
    var s = r.settings;
    localStorage.clear();
    r.setSetting(s);
  };
  r.setSetting = function(v){
    r.settings = v;
    localStorage.setItem('tbsetting', JSON.stringify(v));
  };
  r.loadSetting = function(){
    r.settings = JSON.parse(localStorage.getItem('tbsetting'));
		if (!r.settings){
			r.settings = {
				rpc : "https://mainnet.tezrpc.me",
				language : "english",
				disclaimer : false,
				apiMode : true,
				whitelist : [],
				blacklist : []
			};
			localStorage.setItem('tbsetting', JSON.stringify(r.settings));
		}
		var patch = false;
		if (typeof r.settings.language == 'undefined'){
      r.settings.language = "english";
			patch = true;
    }
		if (typeof r.settings.apiMode == 'undefined'){
      r.settings.apiMode = true;
			patch = true;
    }
		if (typeof r.settings.whitelist == 'undefined'){
      r.settings.whitelist = [];
			patch = true;
    }
		if (typeof r.settings.blacklist == 'undefined'){
      r.settings.blacklist = [];
			patch = true;
    }
		if (patch) localStorage.setItem('tbsetting', JSON.stringify(r.settings));
    return r.settings;
  };
  r.load();
  return r;
});
