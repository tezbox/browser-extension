"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
  'monospaced.qrcode',
  'oitozero.ngSweetAlert'
])
.run(function($rootScope, Lang) {
  $rootScope.translate = Lang.translate;
})
.config(function($routeProvider, $compileProvider) {
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|moz-extension|file):/);
  $routeProvider
  .when("/main", {
    templateUrl : chrome.extension.getURL("app/views/popup.html"),
    controller : "PopupController",
  })
  .when("/unlock", {
    templateUrl : chrome.extension.getURL("app/views/unlock-popup.html"),
    controller : "UnlockController",
  })
  .otherwise({
    redirectTo: '/unlock'
  });
})
.directive('tooltip', function(){
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      element.hover(function(){
        element.tooltip('show');
      }, function(){
        element.tooltip('hide');
      });
    }
  };
})
.directive('numberSelect', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return val != null ? parseFloat(val, 10) : null;
      });
      ngModel.$formatters.push(function(val) {
        return val != null ? '' + val : null;
      });
    }
  };
});