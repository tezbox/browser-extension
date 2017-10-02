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
    return r;
});
