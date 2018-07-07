"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
  'monospaced.qrcode',
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
    .when("/send", {
        templateUrl : chrome.extension.getURL("app/views/send.html"),
        controller : "SendController",
    })
    .when("/delegate", {
        templateUrl : chrome.extension.getURL("app/views/delegate.html"),
        controller : "DelegateController",
    })
    .when("/import", {
        templateUrl : chrome.extension.getURL("app/views/import.html"),
        controller : "ImportController",
    })
    .when("/qr", {
        templateUrl : chrome.extension.getURL("app/views/qr.html"),
        controller : "QrController",
    })
    .when("/setting", {
        templateUrl : chrome.extension.getURL("app/views/setting.html"),
        controller : "SettingController",
    })
    .otherwise({
        redirectTo: '/new'
    });
});