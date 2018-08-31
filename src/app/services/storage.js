app.service('Storage', function() {
    
    var r = {};
    
    r.keys = {};
    r.password = '';
    r.restored = false;
    r.ico = false;
    r.setStore = function(v, k, p){
        localStorage.setItem('tbstore', JSON.stringify(v));
        if (typeof k != 'undefined') r.keys = k;
    };
    r.loadStore = function(){
        return JSON.parse(localStorage.getItem('tbstore'));
    };
    r.clearStore = function(){
      r.keys = {};
      var s = r.loadSetting();
      localStorage.clear();
      r.setSetting(s);
    };
    r.setSetting = function(v){
        localStorage.setItem('tbsetting', JSON.stringify(v));
    };
    r.loadSetting = function(){
        return JSON.parse(localStorage.getItem('tbsetting'));
    };
    return r;
});
