<?php
/**
 * Get delivery prices and settings
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelnl
 *
 * @author      Reindert Vetter <info@sendmyparcel.be>
 * @copyright   2010-2017 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelnl/magento
 * @since       File available since Release v2.0.0
 */

namespace MyParcelBE\Magento\Model\Checkout;


use MyParcelBE\Magento\Api\DeliverySettingsInterface;
use MyParcelBE\Magento\Model\Quote\Checkout;

class DeliverySettings implements DeliverySettingsInterface
{
    /**
     * @var Checkout
     */
    private $settings;

    /**
     * Checkout constructor.
     * @param Checkout $settings
     */
    public function __construct(
        Checkout $settings
    ) {
        $this->settings = $settings;
    }

    public function get()
    {
        return $this->settings->getCheckoutSettings();
    }
}