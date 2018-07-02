"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
  'monospaced.qrcode',
])
app.config(function($routeProvider) {
    $routeProvider
    .when("/create", {
        templateUrl : chrome.extension.getURL("app/views/create.html"),
        controller : "CreateController",
    })
    .when("/unlock", {
        templateUrl : chrome.extension.getURL("app/views/unlock.html"),
        controller : "UnlockController",
    })
    .when("/new", {
        templateUrl : chrome.extension.getURL("app/views/new.html"),
        controller : "NewController",
    })
    .when("/restore", {
        templateUrl : chrome.extension.getURL("app/views/restore.html"),
        controller : "RestoreController",
    })
    .when("/main", {
        templateUrl : chrome.extension.getURL("app/views/main.html"),
        controller : "MainController",
    })
    .when("/send", {
        templateUrl : chrome.extension.getURL("app/views/send.html"),
        controller : "SendController",
    })
    .when("/delegate", {
        templateUrl : chrome.extension.getURL("app/views/delegate.html"),
        controller : "DelegateController",
    })
    .when("/qr", {
        templateUrl : chrome.extension.getURL("app/views/qr.html"),
        controller : "QrController",
    })
    .when("/encrypt", {
        templateUrl : chrome.extension.getURL("app/views/encrypt.html"),
        controller : "EncryptController",
    })
    .when("/setting", {
        templateUrl : chrome.extension.getURL("app/views/setting.html"),
        controller : "SettingController",
    })
    .otherwise({
        redirectTo: '/new'
    });
});