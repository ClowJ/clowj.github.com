(function () {
    'use strict';

    var app = angular.module('app', ['ngRoute', 'ngCookies']);

    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/login', {
                controller: 'LoginController',
                templateUrl: 'login.view.html',
                controllerAs: 'login'
            })
            .when('/details', {
                controller: 'DetailsController',
                templateUrl: 'details.view.html',
                controllerAs: 'details'
            })
            .otherwise({ redirctTo: '/login' });
    }]);

    app.controller('LoginController', ['$http', '$rootScope', '$scope', '$cookieStore', '$location', function ($http, $rootScope, $scope, $cookieStore, $location) {

        var login = this;
        login.loginApi = [];

        $scope.loginCheck = function () {

            var username, password, token;

            username = $scope.email;
            password = $scope.password;

            login.loginApi = [];
            $http({
                method: 'POST',
                url: 'https://system-dev.anyopp.com/api/authentication/login',
                headers: {
                    'ZUMO-API-VERSION': '2.0.0',
                    'Content-Type': 'application/json'
                },
                data: {
                    'username': username,
                    'password': password
                }
            })
            .success(function (data) {
                login.loginApi = data;
                //console.log('LOGINAPI.Token :: ' + login.loginApi.token);
                //console.log('LOGINAPI.Username :: ' + login.loginApi.username);

                $rootScope.globals = {
                    'userinfo': {
                        'username': username,
                        'password': password,
                        'token': login.loginApi.token
                    }
                };
                $cookieStore.put('globals', $rootScope.globals);
                $location.path('/details');
            })
            .error(function () {
                login.message = 'Username or password is incorrect';
            });

        };

    }]);

    app.directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);

    app.service('fileUpload', ['$http', function ($http) {
        this.uploadFileToUrl = function (file, uploadUrl) {
            var fd = new FormData();
            fd.append('file', file);

            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            })
            .success(function () {
            })
            .error(function () {
            });
        }
    }]);

    app.controller('DetailsController', ['$routeParams', '$rootScope', '$scope', '$http', '$cookieStore', 'fileUpload', function ($routeParams, $rootScope, $scope, $http, $cookieStore, fileUpload) {

        var details = this;
        var username, password, token;

        $rootScope.globals = $cookieStore.get('globals')

        //console.log('username :: ' + $rootScope.globals.userinfo.username);
        //console.log('password :: ' + $rootScope.globals.userinfo.password);
        //console.log('token :: ' + $rootScope.globals.userinfo.token);

        username = $rootScope.globals.userinfo.username;
        password = $rootScope.globals.userinfo.password;
        token = $rootScope.globals.userinfo.token;

        $scope.uploadFile = function () {
            var file = $scope.myFile;

            console.log('file is ');
            console.dir(file);

            var uploadUrl = "/upload";

            details.blobApi = [];

            $http({
                method: 'POST',
                url: 'https://system-dev.anyopp.com/api/blob',
                headers: {
                    'ZUMO-API-VERSION': '2.0.0',
                    'Content-Type': 'application/json',
                    'X-ZUMO-AUTH' : 'tokenFormLogin'
                },
                data: {
                    'containerName':'private'
                }
            })
            .success(function (data) {
                details.blobApi = data;
                console.log('BLOBAPI :: ' + details.blobApi);
                console.log('BLOBAPI.Guid :: ' + details.blobApi.Guid);
                console.log('BLOBAPI.FileName :: ' + details.blobApi.FileName);
                fileUpload.uploadFileToUrl(file, uploadUrl);
            });

        };

    }]);

    app.directive('mapCanvas', function () {
        return {
            restrict: 'E',
            link: function (scope, element) {

                var map, autocomplete, marker;

                function initMap(){
                    map = new google.maps.Map(document.getElementById('map'), {
                        center: { lat: -34.397, lng: 150.644 },
                        zoom: 8
                    });

                    // Create the autocomplete object, restricting the search to geographical
                    // location types.
                    autocomplete = new google.maps.places.Autocomplete(
                        /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
                        { types: ['geocode'] });

                    // When the user selects an address from the dropdown, populate the address
                    // fields in the form.
                    autocomplete.addListener('place_changed', fillInAddress);
                }

                // [START region_fillform]
                function fillInAddress() {

                    // Get the place details from the autocomplete object.
                    var place = autocomplete.getPlace();

                    if (place.geometry) {
                        map.panTo(place.geometry.location);
                        map.setZoom(15);

                        marker = new google.maps.Marker({
                            title: place.name,
                            position: place.geometry.location,
                            animation: google.maps.Animation.DROP
                        });

                        // To add the marker to the map, call setMap();
                        marker.setMap(map);

                    } else {
                        document.getElementById('autocomplete').placeholder = 'Enter a city';
                    }
                }
                // [END region_fillform]

                // [START region_geolocation]
                // Bias the autocomplete object to the user's geographical location,
                // as supplied by the browser's 'navigator.geolocation' object.
                function geolocate() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            var geolocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            var circle = new google.maps.Circle({
                                center: geolocation,
                                radius: position.coords.accuracy
                            });
                            autocomplete.setBounds(circle.getBounds());
                        });
                    }
                }
                // [END region_geolocation]

                initMap();
            }
        };
    });

})();
