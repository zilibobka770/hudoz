const { Sequelize } = require('sequelize');

module.exports = new Sequelize('postgres://hykwed:IXGNc5MawURChEmkYu3LNWNeo7Yc7B1j@dpg-cn5hd7uct0pc738fu0pg-a.oregon-postgres.render.com/blog_61i1', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});