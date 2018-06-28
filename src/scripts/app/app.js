"use strict";

// Declare app level module which depends on filters, and services
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
  'monospaced.qrcode',
])

app.config(function($routeProvider) {
    $routeProvider
    .when("/create", {
        templateUrl : chrome.extension.getURL("views/create.html"),
        controller : "CreateController",
    })
    .when("/unlock", {
        templateUrl : chrome.extension.getURL("views/unlock.html"),
        controller : "UnlockController",
    })
    .when("/new", {
        templateUrl : chrome.extension.getURL("views/new.html"),
        controller : "NewController",
    })
    .when("/restore", {
        templateUrl : chrome.extension.getURL("views/restore.html"),
        controller : "RestoreController",
    })
    .when("/main", {
        templateUrl : chrome.extension.getURL("views/main.html"),
        controller : "MainController",
    })
    .when("/send", {
        templateUrl : chrome.extension.getURL("views/send.html"),
        controller : "SendController",
    })
    .when("/delegate", {
        templateUrl : chrome.extension.getURL("views/delegate.html"),
        controller : "DelegateController",
    })
    .when("/qr", {
        templateUrl : chrome.extension.getURL("views/qr.html"),
        controller : "QrController",
    })
    .when("/encrypt", {
        templateUrl : chrome.extension.getURL("views/encrypt.html"),
        controller : "EncryptController",
    })
    .otherwise({
        redirectTo: '/new'
    });
});