import User from '@/models/User.js';
import PackageService from '@/services/PackageService.js';
import SearchLog from '@/models/SearchLog.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class UserController {

    // GET /traveller/packages (or public)
    async browsePackages(req) {
        try {
            const url = new URL(req.url);
            const query = url.searchParams.get('q') || '';

            const packages = await PackageService.getAvailablePackages(query);

            // Log Search if query exists
            if (query) {
                try {
                    await SearchLog.findOneAndUpdate(
                        { query: query.toLowerCase() },
                        {
                            $inc: { count: 1 },
                            $set: { lastSearched: new Date(), resultsCount: packages.length },
                        },
                        { upsert: true, returnDocument: 'after' }
                    );
                } catch (e) { }
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, { packages });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const userController = new UserController();
export default userController;