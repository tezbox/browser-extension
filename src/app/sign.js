"use strict";
var app = angular.module('popup', [
  'ngRoute',
  'angular-blockies',
])
app.config(function($routeProvider) {
    $routeProvider
    .when("/sign", {
        templateUrl : chrome.extension.getURL("app/views/api_sign.html"),
        controller : "SignController",
    })
    .otherwise({
        redirectTo: '/sign'
    });
});