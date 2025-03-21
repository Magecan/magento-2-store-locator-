<?php
/**
 * Copyright © Magecan, Inc. All rights reserved.
 */
namespace Magecan\StoreLocator\Block;

/**
 * Google Maps API Block
 */
class GoogleMapsApi extends \Magento\Framework\View\Element\Template
{
    public const GOOGLE_MAPS_API_KEY_PATH = 'storelocator/general/google_maps_api_key';
    public const GOOGLE_MAPS_LIBRARY_URL = 'https://maps.googleapis.com/maps/api/js?key=%s&libraries=places';

    /**
     * Retrieve the Google Maps API key
     *
     * @return string
     */
    public function getApiKey(): ?string
    {
        return $this->_scopeConfig->getValue(self::GOOGLE_MAPS_API_KEY_PATH);
    }

    /**
     * Generate URL for retrieving Google Maps Javascript API
     *
     * @return string
     */
    public function getLibraryUrl(): string
    {
        return sprintf(self::GOOGLE_MAPS_LIBRARY_URL, $this->getApiKey());
    }

    /**
     * Return the translated message for an invalid API key.
     *
     * @return \Magento\Framework\Phrase
     */
    public function getInvalidApiKeyMessage(): \Magento\Framework\Phrase
    {
        return __(
            "You must provide a valid <a href='%1' target='_blank'>Google Maps API key</a> to use this feature.",
            $this->_urlBuilder->getUrl('adminhtml/system_config/edit/section/storelocator', ['_fragment' => 'general'])
        );
    }
}
