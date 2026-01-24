function successResponse(message = "Success", data = {}) {
    return new Response(JSON.stringify({
        success: true,
        message,
        data
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

function errorResponse(message = "Error", status = 400, data = {}) {
    return new Response(JSON.stringify({
        success: false,
        message,
        data
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export { successResponse, errorResponse };
