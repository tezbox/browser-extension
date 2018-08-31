"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
  'monospaced.qrcode',
  'oitozero.ngSweetAlert'
])

app.config(function($routeProvider) {
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
    .otherwise({
        redirectTo: '/new'
    });
});