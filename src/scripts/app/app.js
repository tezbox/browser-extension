"use strict";

// Declare app level module which depends on filters, and services
var app = angular.module('popup', [
  'ngRoute'
])

app.config(function($routeProvider) {
    console.log($routeProvider);
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
    .otherwise({
        redirectTo: '/new'
    });
});