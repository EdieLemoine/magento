<?php
/**
 * Block for order actions (multiple orders action and one order action)
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelbe
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2017 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelbe/magento
 * @since       File available since Release v0.1.0
 */

namespace MyParcelBE\Magento\Block\Sales;

use Magento\Backend\Block\Template;
use Magento\Backend\Block\Template\Context;
use Magento\Framework\App\ObjectManager;
use MyParcelBE\Sdk\src\Model\MyParcelClassConstants;

class OrderAction extends OrdersAction
{
    /**
     * @var \Magento\Sales\Model\Order
     */
    private $order;
    /**
     * @var \MyParcelBE\Sdk\src\Model\Repository\MyParcelConsignmentRepository
     */
    private $consignmentRepository;

    /**
     * @param Context $context
     * @param \Magento\Framework\Registry $registry
     * @param \MyParcelBE\Sdk\src\Model\Repository\MyParcelConsignmentRepository $consignmentRepository
     * @param array $data
     */
    public function __construct(
        Context $context,
        \Magento\Framework\Registry $registry,
        \MyParcelBE\Sdk\src\Model\Repository\MyParcelConsignmentRepository $consignmentRepository,
        array $data = []
    ) {
        // Set order
        $this->order = $registry->registry('sales_order');
        parent::__construct($context, $data);
        $this->consignmentRepository = $consignmentRepository;
    }

    /**
     * Check if Magento can create shipment
     *
     * Magento shipment contains one or more products. Magento shipments can never make more shipments than the number
     * of products.
     *
     * @return bool
     */
    public function canShip()
    {
        return $this->order->canShip();
    }

    /**
     * Get number of print positions. Always more than one
     */
    public function getNumberOfPrintPositions()
    {
        $numberOfTracks = $this->order->getTracksCollection()->count();
        return $numberOfTracks > 0 ? $numberOfTracks : 1;
    }

    /**
     * @return string
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function getCountry()
    {
        return $this->order->getShippingAddress()->getCountryId();
    }

    /**
     * Check if the address is outside the EU
     * @return bool
     */
    public function isCdCountry()
    {
        return $this->consignmentRepository->isCdCountry();
    }
}
