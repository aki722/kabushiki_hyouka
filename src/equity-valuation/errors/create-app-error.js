function createAppError(code, stage, meta = {}) {
  const err = new Error(code);
  err.code = code;
  err.stage = stage;
  Object.assign(err, meta);
  return err;
}

module.exports = { createAppError };
