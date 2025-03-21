/**
 * Copyright © Magecan, Inc. All rights reserved.
 */

define([
    'jquery',
    'Magento_Ui/js/form/element/abstract',
    'module'
], function ($, AbstractField, module) {
    'use strict';

    var google = window.google || {};

    return AbstractField.extend({
        defaults: {
            elementTmpl: 'Magecan_StoreLocator/form/element/auto-complete',
            apiKeyValid: !!module.config().apiKey,
            apiKeyErrorMessage: module.config().apiKeyErrorMessage
        },

        /**
         * Initializes observable properties of instance
         *
         * @returns {Abstract} Chainable.
         */
        initObservable: function () {
            this._super();

            this.observe('apiKeyValid');

            return this;
        },

        /**
         * Initializes Google Maps Places Autocomplete for the address input field.
         *
         * @param {HTMLElement} element
         */
        initAddressAutocomplete: function (element) {
            if (!this.apiKeyValid()) {
                return;
            }

            var autocomplete = new google.maps.places.Autocomplete(element);
            autocomplete.setFields('geometry');

            autocomplete.addListener('place_changed', function () {
                var place = autocomplete.getPlace();

                $('[name="general[latitude]"]').val('');
                $('[name="general[longitude]"]').val('');
                $('[name="general[country_id]"]').val('');
                $('[name="general[region]"]').val('');
                $('[name="general[city]"]').val('');
                $('[name="general[street]"]').val('');
                $('[name="general[street]"]').val('');
                $('[name="general[postcode]"]').val('');
                
                if (place.geometry) {
                    var latitude = place.geometry.location.lat();
                    var longitude = place.geometry.location.lng();
                    $('[name="general[latitude]"]').val(latitude);
                    $('[name="general[latitude]"]').trigger('change');
                    $('[name="general[longitude]"]').val(longitude);
                    $('[name="general[longitude]"]').trigger('change');
                }

                // Loop through the address components to find country and postal code
                place.address_components.reverse();
                place.address_components.forEach(function (component) {
                    var componentType = component.types[0];
                    
                    if (componentType === 'country') {
                        $('[name="general[country_id]"]').val(component.short_name);
                        $('[name="general[country_id]"]').trigger('change');
                    } else if (componentType === 'administrative_area_level_1') {
                        $('[name="general[region]"]').val(component.short_name);
                        $('[name="general[region]"]').trigger('change');
                    } else if (componentType === 'locality') {
                        $('[name="general[city]"]').val(component.long_name);
                        $('[name="general[city]"]').trigger('change');
                    } else if (componentType === 'route') {
                        $('[name="general[street]"]').val($('[name="general[street]"]').val() + component.long_name);
                        $('[name="general[street]"]').trigger('change');
                    } else if (componentType === 'street_number') {
                        $('[name="general[street]"]').val(component.long_name + ' ' + $('[name="general[street]"]').val());
                        $('[name="general[street]"]').trigger('change');
                    } else if (componentType === 'postal_code') {
                        $('[name="general[postcode]"]').val(component.long_name);
                        $('[name="general[postcode]"]').trigger('change');
                    }
                });
            });
        }
    });
});
