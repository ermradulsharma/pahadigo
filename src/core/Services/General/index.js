import BookingService from './BookingService.js';
import CategoryService from './CategoryService.js';
import InventoryService from './InventoryService.js';
import RazorpayService from './RazorpayService.js';
import NotificationService from './NotificationService.js';

export {
  BookingService,
  CategoryService,
  InventoryService,
  RazorpayService,
  NotificationService
};

export default {
  booking: BookingService,
  category: CategoryService,
  inventory: InventoryService,
  razorpay: RazorpayService,
  notification: NotificationService
};
