const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (parsed.body) {
      req.body = parsed.body;
    }

    if (parsed.params) {
      req.params = parsed.params;
    }

    if (parsed.query) {
      req.query = parsed.query;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRequest;
