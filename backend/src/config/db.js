const pool = require('./database');

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  query,
};
