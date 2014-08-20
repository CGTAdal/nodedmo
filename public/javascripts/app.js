'use strict';

var pollApp = angular.module('pollApp', ['ngRoute','pollServices']);

pollApp.config(['$routeProvider','$locationProvider', function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true);
	$routeProvider
		.when('/polls', { 
			templateUrl: '/partials/list.html' // , controller: PollListCtrl 
		})
		.when('/polls/poll/:pollId', { 
			templateUrl: '/partials/item.html', controller: PollItemCtrl 
		})
		.when('/new', { 
			templateUrl: '/partials/new.html', controller: PollNewCtrl 
		})
		.otherwise({ 
			redirectTo: '/polls' 
		});
		
}]);