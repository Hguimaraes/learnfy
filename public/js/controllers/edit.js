angular.module("learnfy")
  .controller("EditCtrl", function ($scope, $routeParams, $location, $http, $window) {
    
    // Useful variables
    $scope.selectedOptions = {
      'audioprev': false,
      'audiomet': false,
      'genres' : '',
      'maxNumMusic' : 5000,
      'bkp': false
    };

    $scope.genreList = ['metal','disco','classical','hip-hop','jazz',
      'country','pop','blues','reggae','rock'];

    // Function triggered when the user press the submit button in edit interface
    $scope.createDataset = function(){
      // Check if the user has not selected any genre
      // If there is no genre, all the genres will be used
      if(!$scope.selectedOptions.genres || $scope.selectedOptions.genres.length == 0){
        $scope.selectedOptions.genres = $scope.genreList;
      }

      // Check if the user has not selected any audio option
      // If there is no option selected, use the metadata only
      if(!($scope.selectedOptions.audioprev || $scope.selectedOptions.audiomet) ){
        $scope.selectedOptions.audiomet = true;
      }

      // Post to backend to process
      var req = {
        method: 'POST',
        url: '/create_dataset',
        data: {
          configOpt: $scope.selectedOptions
        }
      };
    
      $http(req).then(function(response){
        console.log(response);
      }, function(err){
        console.log(err);
      });

      //Redirect to loading page
      $window.location.href = 'http://localhost:8888/#!/terminal';
    };
  });