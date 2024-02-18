const { DataTypes } = require('sequelize');
const sequelize = require('../config/connect.js');

const Blog = sequelize.define('Blog', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    desc: {
        type: DataTypes.STRING
    },
    image: {
        type: DataTypes.STRING
    }
});

module.exports = Blog;