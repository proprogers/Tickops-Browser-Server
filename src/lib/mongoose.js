const mongoose = require('mongoose');
const { server: { database } } = require('../../config');

const dbAuth = database.username !== undefined ? `${database.username}:${database.password}@` : '';
const dbUri = `mongodb://${dbAuth}${database.host}/${database.name}`;
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));

mongoose.set('useFindAndModify', false);
