<?php
/**
 * Copyright © Magecan, Inc. All rights reserved.
 */
namespace Magecan\StoreLocator\Controller\Search;

class Index extends \Magento\Framework\App\Action\Action
{
    /**
     * @var \Magento\Inventory\Model\SourceRepository
     */
    protected $sourceRepository;

    /**
     * @var \Magento\Framework\Api\SearchCriteriaBuilder
     */
    protected $searchCriteriaBuilder;

    /**
     * @var \Magento\Directory\Model\CountryFactory $countryFactory
     */
    protected $countryFactory;

    /**
     * @var array
     *
     * Cache for country names, indexed by country ID.
     */
    protected $countryRegistery = [];

    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder
     * @param \Magento\Inventory\Model\SourceRepository $sourceRepository
     * @param \Magento\Directory\Model\CountryFactory $countryFactory
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\Api\SearchCriteriaBuilder $searchCriteriaBuilder,
        \Magento\Inventory\Model\SourceRepository $sourceRepository,
        \Magento\Directory\Model\CountryFactory $countryFactory
    ) {
        $this->searchCriteriaBuilder = $searchCriteriaBuilder;
        $this->sourceRepository = $sourceRepository;
        $this->countryFactory = $countryFactory;
        parent::__construct($context);
    }

    /**
     * Builds a search criteria to filter stores based on latitude, longitude, and enabled status.
     *
     * @return \Magento\Framework\Controller\Result\Json
     */
    public function execute()
    {
        $resultJson = $this->resultFactory->create(\Magento\Framework\Controller\ResultFactory::TYPE_JSON);
        $storeArray = [];

        try {
            $this->searchCriteriaBuilder->addFilter('enabled', 1, 'eq')
                ->addFilter('latitude', $this->getRequest()->getParam('north'), 'lteq')
                ->addFilter('latitude', $this->getRequest()->getParam('south'), 'gteq')
                ->addFilter('longitude', $this->getRequest()->getParam('east'), 'lteq')
                ->addFilter('longitude', $this->getRequest()->getParam('west'), 'gteq');

            $searchCriteria = $this->searchCriteriaBuilder->create();

            $stores = $this->sourceRepository->getList($searchCriteria);

            foreach ($stores->getItems() as $store) {
                $storeArray[] = [
                    'name' => $store->getData('name'),
                    'latitude' => $store->getData('latitude'),
                    'longitude' => $store->getData('longitude'),
                    'country' => $this->getCountryName($store->getData('country_id')),
                    'region' => $store->getData('region'),
                    'city' => $store->getData('city'),
                    'street' => $store->getData('street'),
                    'postcode' => $store->getData('postcode'),
                    'phone' => $store->getData('phone'),
                    'email' => $store->getData('email')
                ];
            }
        } catch (LocalizedException $e) {
            $this->messageManager->addNoticeMessage($e->getMessage());
        } catch (\Exception $e) {
            $this->messageManager->addExceptionMessage($e, __('Stores can\'t be listed right now.'));
        }

        $resultJson->setData($storeArray);
        return $resultJson;
    }

    /**
     * Retrieve country name by country ID.
     *
     * Uses a cache mechanism to avoid multiple lookups for the same country.
     *
     * @param string $countryId The two-letter country code (ISO Alpha-2).
     * @return string The country name.
     */
    protected function getCountryName($countryId)
    {
        if (!isset($countryRegistery[$countryId])) {
            $country = $this->countryFactory->create()->loadByCode($countryId);
            $countryRegistery[$countryId] = $country->getName();
        }
        
        return $countryRegistery[$countryId];
    }
}
