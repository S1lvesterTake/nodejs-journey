const mongoose = require('mongoose');
const redis = require('redis');
const key = require('../config/keys');
const client = redis.createClient(key.redisURL);
const util = require('util');

const exec = mongoose.Query.prototype.exec;

// wrap  function client.get to return a promise
client.hget = util.promisify(client.hget);

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = options.key || '';
  return this;
};

mongoose.Query.prototype.exec = async function () {

  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), { collection: this.mongooseCollection.name }));

  // check if have value in our cached
  const cachedValue = await client.hget(this.hashKey, key);

  if (cachedValue) {
    const doc = JSON.parse(cachedValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d)) //if cachedValue return an array
      : new this.model(doc); //if cachedValue return a single object
  }

  const result = await exec.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result),'EX',10); //set up expiration to 10 sec
  return result;
};


module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
}