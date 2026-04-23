import BookingService from '@/core/Services/General/BookingService.js';
import CategoryService from '@/core/Services/General/CategoryService.js';
import InventoryService from '@/core/Services/General/InventoryService.js';
import RazorpayService from '@/core/Services/General/RazorpayService.js';
import NotificationService from '@/core/Services/General/NotificationService.js';

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
