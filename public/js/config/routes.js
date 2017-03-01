angular.module('learnfy')
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        redirectTo: function(obj, requestedPath) {
          window.location.href = 'http://localhost:8888/login';
        }
      })
      .when('/loggedin', {
        templateUrl: '/views/edit.html',
        controller: 'EditCtrl'
      })
      .when('/terminal', {
        templateUrl: '/views/terminal.html'
      })
      .otherwise({
        templateUrl: '/views/error.html'
      })
  });