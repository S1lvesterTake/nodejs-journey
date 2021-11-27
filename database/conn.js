const mongoose = require('mongoose');
const { mongoURI } = require('../config/keys');


const connection = async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`database Connected successfully 😎`);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = connection;
