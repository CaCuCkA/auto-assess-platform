const pool = require("../config/database");

class Homework {
    static async getAllByAdmin(adminId) {
        const query = "SELECT * FROM homeworks WHERE admin_id = $1 ORDER BY created_at DESC";
        const { rows } = await pool.query(query, [adminId]);
        return rows;
    }

    static async findByTitle(title, adminId) {
        const query = "SELECT * FROM homeworks WHERE title = $1 AND admin_id = $2";
        const { rows } = await pool.query(query, [title, adminId]);
        return rows[0];
    }

    static async findById(id, adminId) {
        const query = "SELECT * FROM homeworks WHERE homework_id = $1 AND admin_id = $2";
        const { rows } = await pool.query(query, [id, adminId]);
        return rows[0]; 
    }

    static async create(title, backgroundColor, adminId) {
        const query = `
            INSERT INTO homeworks (title, card_color, admin_id) 
            VALUES ($1, $2, $3) 
            RETURNING *`;
        const { rows } = await pool.query(query, [title, backgroundColor, adminId]);
        return rows[0];
    }

    static async update(title, id, adminId) {
        const query = `
            UPDATE homeworks 
            SET title = $1
            WHERE homework_id = $2 AND admin_id = $3
            RETURNING *`;
        const { rows } = await pool.query(query, [title, id, adminId]);
        return rows[0];
    }

    static async delete(id, adminId) {
        const query = "DELETE FROM homeworks WHERE homework_id = $1 AND admin_id = $2 RETURNING *";
        const { rows } = await pool.query(query, [id, adminId]);
        return rows[0];
    }
}

module.exports = Homework;
