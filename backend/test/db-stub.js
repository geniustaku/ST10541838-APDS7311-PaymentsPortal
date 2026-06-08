// Replaces db/connection during the API smoke test. The smoke test only hits
// endpoints that reject before any SQL runs, so a stub pool is enough.
const stubPool = {
  request: () => ({
    input: function () { return this; },
    query: async () => ({ recordset: [] })
  })
};

module.exports = {
  sql: {
    Int: 'Int',
    NVarChar: 'NVarChar',
    Decimal: () => 'Decimal'
  },
  poolPromise: Promise.resolve(stubPool)
};
