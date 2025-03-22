const pool = require("../config/database");

class Test {
    static async getAllByHomeworkId(homeworkId) { // TODO
        const query = "SELECT * FROM tests WHERE homework_id = $1 ORDER BY updated_at DESC";
        const { rows } = await pool.query(query, [homeworkId]);
        return rows;
    }

    static async getById(testId, homeworkId) {
        const query = "SELECT * FROM tests WHERE test_id = $1 AND homework_id = $2";
        const { rows } = await pool.query(query, [testId, homeworkId]);
        return rows[0];
    }
    
    static async create(name, fileContent, homeworkId) {
        const query = `
            INSERT INTO tests (name, file_content, homework_id) 
            VALUES ($1, $2, $3) 
            RETURNING *`;
        const { rows } = await pool.query(query, [name, fileContent, homeworkId]);
        return rows[0];
    }

    static async update(fields) {
        const { testId, homeworkId, ...updateFields } = fields;
        if (!Object.keys(updateFields).length) {
            throw new Error("No fields to update");
        }
        
        const setClause = Object.keys(updateFields)
            .map((key, index) => `${key} = COALESCE($${index + 1}, ${key})`)
            .join(", ");
        
        const query = `
            UPDATE tests
            SET ${setClause}
            WHERE test_id = $${Object.keys(updateFields).length + 1} 
              AND homework_id = $${Object.keys(updateFields).length + 2}
            RETURNING *`;
        
        const { rows } = await pool.query(query, [...Object.values(updateFields), testId, homeworkId]);
        return rows[0];
    }

    static async updateStatus(isActive, testId, homeworkId) {
        const query = `
            UPDATE tests
            SET is_active = NOT (is_active OR $1)
            WHERE test_id = $2 
            AND homework_id = $3
            RETURNING * `;
        
        const { rows } = await pool.query(query, [isActive, testId, homeworkId]);
        return rows[0];
    }

    static async findByName(name, homeworkId) {
        const query = "SELECT * FROM tests WHERE name = $1 AND homework_id = $2";
        const { rows } = await pool.query(query, [name, homeworkId]);
        return rows[0];
    }

    static async delete(testId, homeworkId) {
        const query = "DELETE FROM tests WHERE test_id = $1 AND homework_id = $2 RETURNING *";
        const { rows } = await pool.query(query, [testId, homeworkId]);
        return rows[0];
    }
}

module.exports = Test;