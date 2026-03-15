import connectDB from '@/config/db.js';
import Setting from '@/models/Setting.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class SettingsController {
    async getSettings(req) {
        try {
            let setting = await Setting.findOne();
            if (!setting) {
                setting = await Setting.create({});
            }
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, setting);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { error: error.message });
        }
    }

    async updateSettings(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            
            let setting = await Setting.findOne();
            if (!setting) {
                setting = new Setting(body);
            } else {
                Object.assign(setting, body);
            }
            await setting.save();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, setting);
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { error: error.message });
        }
    }
}

const settingsController = new SettingsController();
export default settingsController;
