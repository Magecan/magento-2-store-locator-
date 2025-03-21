<?php
/**
 * Copyright © Magecan, Inc. All rights reserved.
 */
namespace Magecan\StoreLocator\Controller\Index;

class Index extends \Magento\Framework\App\Action\Action
{
    /**
     * This method is executed when the Store Locator page is accessed.
     *
     * @return \Magento\Framework\Controller\ResultInterface
     */
    public function execute()
    {
        return $this->resultFactory->create(\Magento\Framework\Controller\ResultFactory::TYPE_PAGE);
    }
}
