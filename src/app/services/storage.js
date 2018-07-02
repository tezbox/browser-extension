app.service('Storage', function() {
    var r = {};
    r.setStore = function(v){
        localStorage.setItem('tbstore', JSON.stringify(v));
    };
    r.loadStore = function(){
        return JSON.parse(localStorage.getItem('tbstore'));
    };
    r.clearStore = function(){
        localStorage.clear();
    };
    r.setSetting = function(v){
        localStorage.setItem('tbsetting', JSON.stringify(v));
    };
    r.loadSetting = function(){
        return JSON.parse(localStorage.getItem('tbsetting'));
    };
    return r;
});
