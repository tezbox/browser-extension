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
  .when("/new", {
    templateUrl : chrome.extension.getURL("app/views/new.html"),
    controller : "NewController",
  })
  .when("/create", {
    templateUrl : chrome.extension.getURL("app/views/create.html"),
    controller : "CreateController",
  })
  .when("/restore", {
    templateUrl : chrome.extension.getURL("app/views/restore.html"),
    controller : "RestoreController",
  })
  .when("/link", {
    templateUrl : chrome.extension.getURL("app/views/link.html"),
    controller : "LinkController",
  })
  .when("/validate", {
    templateUrl : chrome.extension.getURL("app/views/validate.html"),
    controller : "ValidateController",
  })
  .when("/encrypt", {
    templateUrl : chrome.extension.getURL("app/views/encrypt.html"),
    controller : "EncryptController",
  })
  .when("/main", {
    templateUrl : chrome.extension.getURL("app/views/main.html"),
    controller : "MainController",
  })
  .when("/unlock", {
    templateUrl : chrome.extension.getURL("app/views/unlock.html"),
    controller : "UnlockController",
  })
  .when("/setting", {
    templateUrl : chrome.extension.getURL("app/views/setting.html"),
    controller : "SettingController",
  })
	.when("/load", {
    templateUrl : chrome.extension.getURL("app/views/load.html"),
    controller : "LoadController",
  })
  .otherwise({
    redirectTo: '/new'
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