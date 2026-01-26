import User from '../models/User.js';
import Package from '../models/Package.js';
import Booking from '../models/Booking.js';
import Vendor from '../models/Vendor.js';
import BookingService from '../services/BookingService.js';
import PackageService from '../services/PackageService.js';

class UserController {

  // POST /user/book
  async bookPackage(req) {
    try {
      const user = req.user;
      if (!user) {
        return { status: 401, data: { error: 'Unauthorized' } };
      }

      const body = req.jsonBody || await req.json();
      const { packageId, travelDate } = body;

      if (!packageId || !travelDate) {
        return { status: 400, data: { error: 'Package ID and Travel Date are required' } };
      }

      const pkg = await PackageService.getPackageById(packageId);
      if (!pkg) {
        return { status: 404, data: { error: 'Package not found' } };
      }

      const bookingDate = new Date(travelDate);
      if (isNaN(bookingDate.getTime())) {
        return { status: 400, data: { error: 'Invalid travel date format' } };
      }

      const booking = await BookingService.createBooking({
        userId: user.id,
        packageId: pkg._id,
        travelDate: bookingDate,
        price: pkg.price
      });

      return { status: 200, data: { message: 'Booking created', booking } };
    } catch (error) {
      console.error('Booking Error:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }

  // GET /user/packages
  async browsePackages(req) {
    try {
      const packages = await PackageService.getAvailablePackages();
      return { status: 200, data: { packages } };
    } catch (error) {
      console.error('Browse Packages Error:', error);
      return { status: 500, data: { error: 'Internal Server Error' } };
    }
  }
}

export default new UserController();
