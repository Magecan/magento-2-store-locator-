/**
 * Copyright © Magecan, Inc. All rights reserved.
 */

define([
    'ko',
    'jquery',
    'mage/translate',
    'uiComponent'
], function (ko, $, $t, Component) {
    'use strict';

    var boundsChangedListenerHandle;
    
    return Component.extend({
        stores: ko.observableArray(),
        message: ko.observable({}),
        store_markers: [],
        search_location_marker: null,

        initialize: function () {
            this._super();
            this.initMap();

            return this;
        },

        searchAddress: function () {
            var self = this;

            $('body').trigger('processStart');
            self.resetMap();

            var address = $('#address').val();
            if (!address.trim()) {
                self.setMessage($t('Please provide a valid address.'), 'notice');
                return;
            }

            var geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status === 'OK') {
                    self.ajaxSubmit(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                } else {
                    self.setMessage($t('Your address can not be found on maps.'), 'notice');
                }
            });
        },

        searchMyLocation: function () {
            var self = this;

            $('body').trigger('processStart');
            $('#address').val('');
            self.resetMap();

            if (navigator.geolocation) {
                // Get the current position
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        self.ajaxSubmit(latitude, longitude);
                        // Do something with the coordinates, e.g., return or store them
                    },
                    (error) => {
                        self.setMessage(error.message, 'notice');
                    }
                );
            } else {
                self.setMessage($t('Geolocation is not supported by this browser.'), 'notice');
            }
        },

        ajaxSubmit: function (latitude, longitude) {
            var self = this;

            $.ajax({
                url: window.storeLocatorConfig.search_action_url,
                data: this.getCoordinatorBounds(latitude, longitude, parseFloat($('#radius').val())),
                type: 'post',
                dataType: 'json',
                success: function (data, textStatus, jqXHR) {
                   self.renderMap(data, latitude, longitude, parseFloat($('#radius').val()));                    
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    self.setMessage($t('Something was wrong.'), 'error');
                }
            });
        },

        setMessage: function (text, type) {
            var msg = this.message();

            msg.text = text;
            msg.type = type;
            this.message(msg);

            $('#store-list').removeClass('hidden');
            $('#store-list').removeClass('collapsed');
            $('#toggle-store-list-icon').removeClass('hidden');
            $('#toggle-store-list-icon').removeClass('collapsed');
            $('#map-overlay').addClass('expanded');
            $('body').trigger('processStop');
        },

        getCoordinatorBounds: function (latitude, longitude, radius) {
            /*
            N/S or E/W at equator    E/W at 23N/S    E/W at 45N/S    E/W at 67N/S
            111.32 km                102.47 km        78.71 km        43.496 km
            */

            const latDelta = radius / 111.32;
            let lonDelta;

            if (Math.abs(latitude) < 23) {
                lonDelta = radius / 102.47;
            } else if (Math.abs(latitude) < 45) {
                lonDelta = radius / 78.71;
            } else if (Math.abs(latitude) < 67) {
                lonDelta = radius / 43.496;
            } else {
                lonDelta = 180;
            }

            return {
                north: Math.min(90, latitude + latDelta),
                south: Math.max(-90, latitude - latDelta),
                east: Math.min(180, longitude + lonDelta), // Assuming no land around Longitude 180
                west: Math.max(-180, longitude - lonDelta)
            };
        },

        getDistance: function (latFrom, lonFrom, latTo, lonTo) {
            const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

            // Convert degrees to radians
            const deg2rad = (degrees) => degrees * (Math.PI / 180);

            // Convert coordinates from degrees to radians
            latFrom = deg2rad(latFrom);
            lonFrom = deg2rad(lonFrom);
            latTo = deg2rad(latTo);
            lonTo = deg2rad(lonTo);

            // Calculate differences
            const latDelta = latTo - latFrom;
            const lonDelta = lonTo - lonFrom;

            // Haversine formula
            const angle = 2 * Math.asin(Math.sqrt(
                Math.sin(latDelta / 2) ** 2 +
                Math.cos(latFrom) * Math.cos(latTo) * (Math.sin(lonDelta / 2) ** 2)
            ));

            // Return distance in kilometers
            return angle * EARTH_RADIUS_KM;
        },

        insertStore: function (newStore) {
            const stores = this.stores(); // Get the current array
            const newDistance = newStore.distance;

            // Find the correct index to insert the new store
            let insertIndex = stores.findIndex(store => store.distance > newDistance);

            // If all existing stores have a smaller distance, append to the end
            if (insertIndex === -1) {
                insertIndex = stores.length;
            }

            // Insert the new store at the correct position
            this.stores.splice(insertIndex, 0, newStore);
        },

        toggleStoreList: function () {
            if ($('#store-list').hasClass('collapsed')) {
                $('#store-list').removeClass('collapsed');
                $('#toggle-store-list-icon').removeClass('collapsed');
                $('#map-overlay').addClass('expanded');
            } else {
                $('#store-list').addClass('collapsed');
                $('#toggle-store-list-icon').addClass('collapsed');
                $('#map-overlay').removeClass('expanded');
            }
        },

        mapOverlayClick: function () {
            $('#store-list').addClass('collapsed');
            $('#toggle-store-list-icon').addClass('collapsed');
            $('#map-overlay').removeClass('expanded');
        },

        /* 
         * The following functions are map-specific
         */
        initMap: function () {
            var map = new google.maps.Map(document.getElementById('map'), {
                center: {
                    lat: window.storeLocatorConfig.map_center_latitude,
                    lng: window.storeLocatorConfig.map_center_longitude
                },
                zoom: window.storeLocatorConfig.initial_zoom,
                mapTypeControl: false,
                fullscreenControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}
            });

            var autocomplete = new google.maps.places.Autocomplete(document.getElementById('address'));
            autocomplete.bindTo('bounds', map); //autocomplete requests use the current map bounds

            boundsChangedListenerHandle = google.maps.event.addListener(map, 'bounds_changed', this.boundsChanged);
        },
        
        boundsChanged: function () {
            var self = this;
            var bounds = this.getBounds();

            google.maps.event.removeListener(boundsChangedListenerHandle);

            $.ajax({
                url: window.storeLocatorConfig.search_action_url,
                data: {
                    north: bounds.ei.hi,
                    east: bounds.Gh.hi,
                    west: bounds.Gh.lo,
                    south: bounds.ei.lo
                },
                type: 'post',
                dataType: 'json',
                success: function (data, textStatus, jqXHR) {
                    for (const coordinate of data) {
                        var marker = new google.maps.Marker({
                            position: {lat: parseFloat(coordinate.latitude), lng: parseFloat(coordinate.longitude)},
                            map: self,
                            icon: window.storeLocatorConfig.store_marker
                        });
                    }              
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // Do nothing
                }
            });
        },

        resetMap: function () {
            var self = this;

            this.stores([]);    
            this.message({});

            for (var i = 0; i < self.store_markers.length; i++) {
                self.store_markers[i].setMap(null);
            }
            self.store_markers = [];

            if (self.search_location_marker != null) {
                self.search_location_marker.setMap(null);
                self.search_location_marker = null;
            }
        },

        renderMap: function (data, latitude, longitude, radius) {
            var self = this;

            $('#store-list').removeClass('hidden');
            $('#toggle-store-list-icon').removeClass('hidden');
            var map = new google.maps.Map(document.getElementById('map'), {
                center: {
                    lat: latitude,
                    lng: longitude
                },
                zoom: 8,
                mapTypeControl: false,
                fullscreenControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}
            });

            if (window.storeLocatorConfig.search_location_marker != null) {
                self.search_location_marker = new google.maps.Marker({
                    position: {lat: latitude, lng: longitude},
                    map: map,
                    icon: window.storeLocatorConfig.search_location_marker,
                    title:"Search Location"
                });
            }

            var infowindow = new google.maps.InfoWindow();
            var bounds = new google.maps.LatLngBounds();
            var myLatLng = new google.maps.LatLng(latitude, longitude);
            bounds.extend(myLatLng);

            for (var i = 0; i < data.length; i++) {
                var store = data[i];
                
                var distance = this.getDistance(latitude, longitude, store.latitude, store.longitude);
                if (distance > radius) {
                    continue;
                }

                store.distance = distance;
                this.insertStore(store);
            }

            for (var i = 0; i < this.stores().length; i++) {
                var store = this.stores()[i];
                
                var marker = new google.maps.Marker({
                    position: {lat: Number(store.latitude), lng: Number(store.longitude)},
                    map: map,
                    icon: window.storeLocatorConfig.store_marker,
                    title: store.name
                });

                marker.addListener('click', function () {
                    var scrollTop = $(window).scrollTop();
                    var index = self.store_markers.indexOf(this);

                    let storeItem = $('.store-item').eq(index);
                    storeItem.find('[data-bind]').addBack('[data-bind]').removeAttr('data-bind');

                    infowindow.setContent(storeItem.html());
                    infowindow.open(map, this);

                    $(window).scrollTop(scrollTop);
                });

                self.store_markers.push(marker);
                store.marker = marker;

                myLatLng = new google.maps.LatLng(Number(store.latitude), Number(store.longitude));
                bounds.extend(myLatLng);
            }
            
            var count = self.stores().length;
            if (count <= 0) {
                self.setMessage($t('There is no store nearby.'), 'notice');
                return;
            } else if (count == 1) {
                self.setMessage($t('There is 1 store nearby.'), 'success');
            } else {
                self.setMessage($t('There are %1 stores nearby.').replace('%1', count), 'success');
            }

            map.fitBounds(bounds);
        },

        storeItemMouseover: function (store) {
            store.marker.setAnimation(google.maps.Animation.BOUNCE);
        },
            
        storeItemMouseOut: function (store) {
            store.marker.setAnimation(null);
        }
    });
});
