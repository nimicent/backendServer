const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const  fs = require("fs");
require('dotenv').config();

const app = express();

const blogRoutes = require('./routes/blog'),
      authRoutes = require('./routes/auth'),
      userRoutes = require('./routes/user'),
      tagRoutes = require('./routes/tag'),
      categoryRoutes = require('./routes/category'),
      formRoutes = require('./routes/form');


app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const mongoose = require('mongoose');

require("dotenv").config({ path: "config.env" });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB is 👾'));

app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', tagRoutes);
app.use('/api', categoryRoutes);
app.use('/api', formRoutes);


const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
