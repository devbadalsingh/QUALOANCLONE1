const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        // Log the error to the console
        console.error('Error:', err);

        // Return a JSON response with the error
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });

        // Pass the error to the next middleware if needed
        next(err);
    });
};

export default asyncHandler;
