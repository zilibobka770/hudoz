const { Sequelize } = require('sequelize');

module.exports = new Sequelize('postgres://hudoz_user:Wbf28u3whuDCc4HWMUHPc50fMhJwHoK0@dpg-cn90927109ks739rideg-a.oregon-postgres.render.com/hudoz', {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});