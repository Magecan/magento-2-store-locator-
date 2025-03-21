<?php
/**
 * Copyright © Magecan, Inc. All rights reserved.
 */
namespace Magecan\StoreLocator\Block;

class StoreLocator extends \Magento\Framework\View\Element\Template
{
    protected const STORE_MARKER = 'store_marker';
    protected const SEARCH_LOCATION_MARKER = 'search_location_marker';

    /**
     * @var \Magento\Framework\Serialize\SerializerInterface
     */
    private $serializer;

    /**
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param \Magento\Framework\Serialize\SerializerInterface $serializer
     * @param array $data
     */
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        \Magento\Framework\Serialize\SerializerInterface $serializer,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->serializer = $serializer;
    }

    /**
     * Prepare layout for the Store Locator page.
     *
     * Sets the page title, breadcrumbs, and SEO metadata.
     *
     * @return $this
     */
    protected function _prepareLayout()
    {
        parent::_prepareLayout();

        $pageTitle = $this->getConfigData('page_title');
        $pageTitle = __($pageTitle);
        $this->pageConfig->getTitle()->set($pageTitle);

        $breadcrumbsBlock = $this->getLayout()->getBlock('breadcrumbs');
        if ($breadcrumbsBlock) {
            $breadcrumbsBlock->addCrumb(
                'home',
                [
                    'label' => __('Home'),
                    'title' => __('Go to Home Page'),
                    'link' => $this->_storeManager->getStore()->getBaseUrl()
                ]
            );
            $breadcrumbsBlock->addCrumb(
                'store_locator',
                ['label' => $pageTitle, 'title' => $pageTitle]
            );
        }

        $seoConfig = $this->_scopeConfig->getValue(
            'storelocator/seo',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORES
        );

        if (isset($seoConfig['meta_title'])) {
            $this->pageConfig->setMetaTitle($seoConfig['meta_title']);
        }

        if (isset($seoConfig['meta_keywords'])) {
            $this->pageConfig->setKeywords($seoConfig['meta_keywords']);
        }

        if (isset($seoConfig['meta_description'])) {
            $this->pageConfig->setDescription($seoConfig['meta_description']);
        }

        return $this;
    }

    /**
     * Retrieve the Google API key for the store locator.
     *
     * @return string|null
     */
    public function getGoogleApiKey()
    {
        return $this->getConfigData('google_api_key');
    }

    /**
     * Retrieve the available search radius options.
     *
     * @return array
     */
    public function getAvailableRadius()
    {
        $radiusValues = $this->getConfigData('radius_options');
        
        return explode(',', $radiusValues);
    }
    /**
     * Retrieve the default search radius.
     *
     * @return string|null
     */
    public function getDefaultRadius()
    {
        return $this->getConfigData('default_radius');
    }

    /**
     * Retrieve the URL for the Store Locator page.
     *
     * @return string
     */
    public function getStoreLocatorUrl()
    {
        return $this->getUrl('storelocator');
    }

    /**
     * Retrieve the marker image URL based on type (store or search location).
     *
     * @param string $type
     * @return string|null
     */
    public function getMarkerImage($type)
    {
        $imageName = $this->getConfigData($type);

        if (null === $imageName) {
            return null;
        }
        
        return $this->_storeManager->getStore()->getBaseUrl(\Magento\Framework\UrlInterface::URL_TYPE_MEDIA)
            . 'storelocator/' . $imageName;
    }

    /**
     * Retrieve the configuration for the Store Locator as a serialized JSON string.
     *
     * @return string
     */
    public function getStoreLocatorConfig()
    {
        $config = [
            'map_height' => $this->getConfigData('map_height'),
            'map_center_latitude' => (float)$this->getConfigData('map_center_latitude'),
            'map_center_longitude' => (float)$this->getConfigData('map_center_longitude'),
            'initial_zoom' => (int)$this->getConfigData('initial_zoom'),
            'search_action_url' => $this->getUrl('storelocator/search'),
            'store_marker' => $this->getMarkerImage(self::STORE_MARKER),
            'search_location_marker' => $this->getMarkerImage(self::SEARCH_LOCATION_MARKER)
        ];

        return  $this->serializer->serialize($config);
    }

    /**
     * Retrieve the configured map height.
     *
     * @return string|null
     */
    public function getMapHeight()
    {
        return $this->getConfigData('map_height');
    }

    /**
     * Retrieve information from system configuration based on a field name.
     *
     * @param string $field
     * @return string|null
     */
    private function getConfigData($field)
    {
        $path = 'storelocator/general/' . $field;

        return $this->_scopeConfig->getValue(
            $path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE,
            $this->getStore()
        );
    }
}
