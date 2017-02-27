angular.module('learnfy')
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/views/edit.html'
      })
      .otherwise({
        templateUrl: '/views/error.html'
      })
  });