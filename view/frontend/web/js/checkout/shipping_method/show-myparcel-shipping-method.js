define(
    [
        'mage/url',
        'uiComponent',
        'Magento_Checkout/js/model/quote',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/checkout-data',
        'jquery',
        'text!MyParcelBE_Magento/template/checkout/options.html',
        'text!MyParcelBE_Magento/css/checkout/options-dynamic.min.css',
        'MyParcelBE_Magento/js/lib/myparcel',
        'Magento_Checkout/js/action/set-shipping-information'
    ],
    function(mageUrl, uiComponent, quote, customer, checkoutData,jQuery, optionsHtml, cssDynamic, moment, setShippingInformationAction) {
        'use strict';

        var  originalShippingRate, optionsContainer, isLoading, myparcel, delivery_options_input, myparcel_method_alias, myparcel_method_element, isLoadingAddress;

        return {
            loadOptions: loadOptions,
            showOptions: showOptions,
            hideOptions: hideOptions
        };

        function loadOptions() {
            if (typeof window.mypa === 'undefined') {
                window.mypa = {isLoading: false, fn: {}};
            }
            window.mypa.fn.hideOptions = hideOptions;
            window.mypa.moment = moment;
            window.mypa.setShippingInformationAction = setShippingInformationAction;

            if (window.mypa.isLoading === false) {
                _hideRadios();
                window.mypa.isLoading = true;
                isLoading = setTimeout(function(){
                    clearTimeout(isLoading);
                    _hideRadios();

                    jQuery.ajax({
                        url: mageUrl.build('rest/V1/delivery_settings/get'),
                        type: "GET",
                        dataType: 'json',
                        showLoader: true
                    }).done(function (response) {
                        window.mypa.data = response[0].data;
                        init();
                        window.mypa.isLoading = false;
                    });

                }, 50);
            }
        }

        function init() {
            if ((myparcel_method_alias = window.mypa.data.general.parent_carrier) === null) {
                return void 0;
            }

            myparcel_method_element = "input[id^='s_method_" + myparcel_method_alias + "_']";
            checkAddress();
        }

        function checkAddress() {
            isLoadingAddress = setTimeout(function(){
                clearTimeout(isLoadingAddress);
                _setAddress();
                _hideRadios();
                if (_getCcIsLocal() && _getHouseNumber() !== null) {
                    _appendTemplate();
                    _setParameters();
                    showOptions();
                } else {
                    jQuery(myparcel_method_element + ":first").parent().parent().show();
                    hideOptions();
                }

                _observeFields();
            }, 1000);
        }

        function _setAddress() {
            if (customer.isLoggedIn() &&
                typeof quote !== 'undefined' &&
                typeof quote.shippingAddress !== 'undefined' &&
                typeof quote.shippingAddress._latestValue !== 'undefined' &&
                typeof quote.shippingAddress._latestValue.street !== 'undefined' &&
                typeof quote.shippingAddress._latestValue.street[0] !== 'undefined'
            ) {
                var street0 = quote.shippingAddress._latestValue.street[0];
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = quote.shippingAddress._latestValue.street[1];
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = quote.shippingAddress._latestValue.street[2];
                if (typeof street2 === 'undefined') street2 = '';
                var country = quote.shippingAddress._latestValue.countryId;
                if (typeof country === 'undefined') country = '';
                var postcode = quote.shippingAddress._latestValue.postcode;
                if (typeof postcode === 'undefined') postcode = '';
                var city = quote.shippingAddress._latestValue.city;
                if (typeof city === 'undefined') city = '';
            } else {
                var street0 = jQuery("input[name='street[0]']").val();
                if (typeof street0 === 'undefined') street0 = '';
                var street1 = jQuery("input[name='street[1]']").val();
                if (typeof street1 === 'undefined') street1 = '';
                var street2 = jQuery("input[name='street[2]']").val();
                if (typeof street2 === 'undefined') street2 = '';
                var country = jQuery("select[name='country_id']").val();
                if (typeof country === 'undefined') country = '';
                var postcode = jQuery("input[name='postcode']").val();
                if (typeof postcode === 'undefined') postcode = '';
                var city = jQuery("input[name='city']").val();
                if (typeof city === 'undefined') city = '';
            }

            window.mypa.address = [];
            window.mypa.address.street0 = street0.replace(/[<>=]/g,'');
            window.mypa.address.street1 = street1.replace(/[<>=]/g,'');
            window.mypa.address.street2 = street2.replace(/[<>=]/g,'');
            window.mypa.address.cc = country.replace(/[<>=]/g,'');
            window.mypa.address.postcode = postcode.replace(/[\s<>=]/g,'');
            window.mypa.address.city = city.replace(/[<>=]/g,'');
        }

        /**
         * Use the validated address data from POSTCODE.NL
         * @returns {* | jQuery}
         */
        function getPostcodeValidateAddress() {
            var validatedAddress = jQuery(".postcode-valid-address").text();

            if (jQuery("select[name='country_id']").val() === 'BE') {
                validatedAddress = jQuery('#shipping-be-street').val() + ' ' + jQuery('#shipping-be-house').val();
            }
            return validatedAddress
        }

        function showOptions() {
            originalShippingRate = jQuery("td[id^='label_carrier_" + window.mypa.data.general.parent_method + "']").parent();
            optionsContainer.show();

            if (typeof originalShippingRate !== 'undefined') {
                originalShippingRate.hide();
            }
        }

        function hideOptions() {
            if (typeof optionsContainer !== 'undefined') {
                optionsContainer.hide();
            }
            jQuery(myparcel_method_element + ':first').parent().parent().show();
        }

        function _hideRadios() {
            jQuery("td[id^='label_method_signature'],td[id^='label_method_pickup']").parent().hide();
        }

        function _getCcIsLocal() {
            if (window.mypa.address.cc !== 'BE') {
                return false;
            }

            return true;
        }

        function _getFullStreet() {
            return (window.mypa.address.street0 + ' ' + window.mypa.address.street1 + ' ' + window.mypa.address.street2).trim();
        }

        function _getHouseNumber() {
            var fullStreet = _getFullStreet();
            var streetParts = fullStreet.match(/[^\d]+([0-9]{1,4})[^\d]*/);
            if (streetParts !== null) {
                return streetParts[1];
            } else {
                var streetParts = fullStreet.match(/(.*?)\s?(([\d]+)[\s|-]?([a-zA-Z/\s]{0,5}$|[0-9/]{0,5}$|\s[a-zA-Z]{1}[0-9]{0,3}$|\s[0-9]{2}[a-zA-Z]{0,3}$))$/);
                return streetParts !== null ? streetParts[3] : null;
            }
        }

        function _observeFields() {
            delivery_options_input = jQuery("input[name='delivery_options']");

            jQuery("input[id^='s_method']").parent().on('change', function (event) {
                setTimeout(function(){
                    if (jQuery(myparcel_method_element + ':checked').length === 0) {
                        delivery_options_input.val('');
                        MyParcel.optionsHaveBeenModified();
                    }
                }, 50);
            });

            jQuery("input[name^='street'],input[name='postcode'],input[name^='pc_postcode'],select[name^='pc_postcode']").on('change', function (event) {
                setTimeout(function(){
                    checkAddress();
                }, 100);
            });

            delivery_options_input.on('change', function (event) {
                _checkShippingMethod();
            });
        }

        function _setParameters() {
            var data = {
                address: {
                    cc: window.mypa.address.cc,
                    street: _getFullStreet(),
                    postalCode: window.mypa.address.postcode,
                    number: _getHouseNumber(),
                    city: window.mypa.address.city
                },
                txtWeekDays: [
                    'Zondag',
                    'Maandag',
                    'Dinsdag',
                    'Woensdag',
                    'Donderdag',
                    'Vrijdag',
                    'Zaterdag'
                ],
                translateENtoNL: {
                    'monday': 'maandag',
                    'tuesday': 'dindsag',
                    'wednesday': 'woensdag',
                    'thursday': 'donderdag',
                    'friday': 'vrijdag',
                    'saturday': 'zaterdag',
                    'sunday': 'zondag'
                },
                config: {
                    "apiBaseUrl": "https://api.myparcel.nl/",
                    "carrier": "2",

                    "priceStandardDelivery": window.mypa.data.general.base_price,
                    "priceSignature": window.mypa.data.delivery.signature_fee,
                    "pricePickup": window.mypa.data.pickup.fee,

                    // "allowSaturdayDelivery": window.data.delivery.saturday_active,
                    "allowSignature": window.mypa.data.delivery.signature_active,
                    "allowPickupPoints": window.mypa.data.pickup.active,

                    "dropOffDays": window.mypa.data.general.dropoff_days,
                    "saturdayCutoffTime": window.mypa.data.general.saturday_cutoff_time,
                    "cutoffTime": window.mypa.data.general.cutoff_time,
                    "deliverydaysWindow": window.mypa.data.general.deliverydays_window,
                    "dropoffDelay":window.mypa.data.general.dropoff_delay
                },
                textToTranslate: {
                    "deliveryTitle": window.mypa.data.text.delivery_title,
                    "deliveryStandardTitle": window.mypa.data.text.standard_delivery_title,
                    "signatureTitle": window.mypa.data.text.signature_title,
                    "pickupTitle": window.mypa.data.text.pickup_title,

                    "allDataNotFound": window.mypa.data.text['all_data_not_found'],
                    "pickUpFrom": window.mypa.data.text['pick_up_from'],
                    "openingHours": window.mypa.data.text['opening_hours'],
                    "closed": window.mypa.data.text['closed'],
                    "postcode": window.mypa.data.text['postcode'],
                    "houseNumber": window.mypa.data.text['house_number'],
                    "city": window.mypa.data.text['city'],
                    "again": window.mypa.data.text['again'],
                    "wrongHouseNumberCity": window.mypa.data.text['wrong_house_number_city'],
                    "quickDelivery":window.mypa.data.text['quick_delivery'],

                    'sunday': window.mypa.data.text['sunday'],
                    'monday': window.mypa.data.text['monday'],
                    'tuesday': window.mypa.data.text['tuesday'],
                    'wednesday': window.mypa.data.text['wednesday'],
                    'thursday': window.mypa.data.text['thursday'],
                    'friday': window.mypa.data.text['friday'],
                    'saturday': window.mypa.data.text['saturday']
                }

            };
            MyParcel.init(data);
        }

        function _appendTemplate() {
            if (jQuery('#myparcel_td').length === 0) {
                var data = window.mypa.data;
                var baseColor = data.general.color_base;
                var selectColor = data.general.color_select;
                cssDynamic = cssDynamic.replace(/_base_color_/g, baseColor).replace(/_select_color_/g, selectColor);
                optionsHtml = optionsHtml.replace('<css-dynamic/>', cssDynamic);

                originalShippingRate = jQuery("td[id^='label_carrier_" + window.mypa.data.general.parent_method + "']").parent();
                optionsContainer = originalShippingRate.parent().prepend('<tr><td colspan="5" id="myparcel_td" >Bezig met laden...</td></tr>').find('#myparcel_td');

                optionsContainer.html(optionsHtml);
                jQuery('#mypa-pickup_title').html(data.pickup.title);
                jQuery('#mypa-delivery_title').html(data.delivery.delivery_title);

            }
        }

        function _checkShippingMethod() {
            var inputValue, json, type;

            inputValue = delivery_options_input.val();
            if (inputValue === '') {
                return;
            }

            json = jQuery.parseJSON(inputValue);

            if (typeof json.time[0].price_comment !== 'undefined') {
                type = json.time[0].price_comment;
            } else {
                type = json.price_comment;
            }

            switch (type) {
                case "standard":

                    if (json.options.signature) {
                        _checkMethod('input[value=' + myparcel_method_alias + '_signature' + ']');
                    } else {
                        _checkMethod('input[value=' + myparcel_method_alias + '_' + window.mypa.data.general.parent_method + ']');
                    }

                    myparcel.showDays();
                    break;
                case "retail":
                    _checkMethod('input[value=' + myparcel_method_alias + '_pickup' + ']');
                    myparcel.hideDays();
                    break;
            }
        }

        function _checkMethod(selector) {
            jQuery(".col-method > input[type='radio']").prop("checked", false).change();
            jQuery(selector).prop("checked", true).change().trigger('click');
        }
    }
);
