// Centralized Express error handler
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record already exists with this unique value.',
      error: err.sqlMessage || err.message
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete record: It is referenced by active subscriptions, quotations, or invoices. Deactivate instead.',
      error: err.sqlMessage || err.message
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      message: 'Referenced foreign key entity does not exist.',
      error: err.sqlMessage || err.message
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
