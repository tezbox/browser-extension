"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
])
app.config(function($routeProvider) {
    $routeProvider
    .when("/send", {
        templateUrl : chrome.extension.getURL("app/views/api_send.html"),
        controller : "SendController",
    })
    .otherwise({
        redirectTo: '/send'
    });
});