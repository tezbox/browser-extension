"use strict";

// Declare app level module which depends on filters, and services
var app = angular.module('popup', [
  'ngRoute'
])

app.config(function($routeProvider) {
    console.log($routeProvider);
    $routeProvider
    .when("/send", {
        templateUrl : chrome.extension.getURL("views/send2.html"),
        controller : "SendController",
    })
    .otherwise({
        redirectTo: '/send'
    });
});