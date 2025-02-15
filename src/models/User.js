const bcrypt = require("bcryptjs");
const pool = require("../config/database");

class User {
    static async findByEmail(email) {
        const query = "SELECT admin_id, email, hashed_password FROM admins WHERE email = $1";
        console.log(query);
        const { rows } = await pool.query(query, [email]);
        return rows[0];
    }

    static async create({ fullName, email, password }) {
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        
        const query = `
            INSERT INTO admins (full_name, email, hashed_password)
            VALUES ($1, $2, $3)
            RETURNING admin_id, full_name, email
        `;
        
        const { rows } = await pool.query(query, [fullName, email, hashedPassword]);
        return rows[0];
    }

    static async comparePassword(inputPassword, storedHashedPassword) {
        return bcrypt.compare(inputPassword, storedHashedPassword);
    }
}

module.exports = User;
