export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    return next();
  } catch (error) {
    const formattedErrors = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    })) || [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.message || 'Validation failed',
      errors: formattedErrors
    });
  }
};
