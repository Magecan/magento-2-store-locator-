<?php
/**
 * Copyright © Magecan, Inc. All rights reserved.
 */
namespace Magecan\StoreLocator\Block;

/**
 * This block class is responsible for handling the Mini Store Locator functionality
 * in the Magento storefront.
 */
class MiniStoreLocator extends \Magento\Framework\View\Element\Template
{
    /**
     * Get the URL for the store locator page.
     *
     * @return string
     */
    public function getStoreLocatorUrl()
    {
        return $this->getUrl('storelocator');
    }
}
