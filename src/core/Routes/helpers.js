/**
 * Circular-Safe Route Handler Wrapper.
 *
 * Instead of binding the controller method at definition time (which can lead to
 * "Cannot access before initialization" errors in circular dependency chains),
 * this wrapper resolves the handler dynamically at request time.
 *
 * @param {Object|Function} controller - The controller instance OR a function that returns it
 * @param {string} methodName - The name of the method to execute
 */
export const wrap = (controller, methodName) => {
  return async (req, params) => {
    try {
      const { apiHandler } = await import('@/core/Helpers/apiHandler.js');
      let instance = typeof controller === 'function' ? controller() : controller;
      const method = instance[methodName].bind(instance);
      return apiHandler(method)(req, params);
    } catch (error) {
      const { errorResponse } = await import('@/core/Helpers/response.js');
      const { HTTP_STATUS, RESPONSE_MESSAGES } = await import('@/core/Constants/index.js');
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  };
};

export default { wrap };
