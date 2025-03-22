const pool = require("../config/database");

class Report { 
    static async getAllByParticipant(participantId) { // TODO
        const query = "SELECT * FROM reports WHERE participant_id = $1 ORDER BY updated_at DESC";
        const { rows } = await pool.query(query, [participantId]);
        return rows;
    }

    static async getUnreviewed() {
        const query = "SELECT * FROM reports WHERE is_submited = FALSE AND is_rejected = FALSE ORDER BY updated_at DESC";
        const { rows } = await pool.query(query);
        return rows;
    }

    static async findByTitle(title, participantId) {
        const query = "SELECT * FROM reports WHERE title = $1 AND participant_id = $2";
        const { rows } = await pool.query(query, [title, participantId]);
        return rows[0];
    }

    static async findById(reportId, participantId) {
        const query = "SELECT * FROM reports WHERE report_id = $1 AND participant_id = $2";
        const { rows } = await pool.query(query, [reportId, participantId]);
        return rows[0]; 
    }

    static async create(title, participantId) {
        const query = `
            INSERT INTO reports (title, participant_id) 
            VALUES ($1, $2) 
            RETURNING *`;
        const { rows } = await pool.query(query, [title, participantId]);
        return rows[0];
    }

    static async update(fields) {
        const { reportId, participantId, ...updateFields } = fields;
        if (!Object.keys(updateFields).length) {
            throw new Error("No fields to update");
        }
        
        const setClause = Object.keys(updateFields)
            .map((key, index) => `${key} = COALESCE($${index + 1}, ${key})`)
            .join(", ");
        
        const query = `
            UPDATE reports 
            SET ${setClause}
            WHERE report_id = $${Object.keys(updateFields).length + 1} 
              AND participant_id = $${Object.keys(updateFields).length + 2}
            RETURNING *`;
        
        const { rows } = await pool.query(query, [...Object.values(updateFields), reportId, participantId]);
        return rows[0];
    }
    

    static async delete(reportId, participantId) {
        const query = "DELETE FROM reports WHERE report_id = $1 AND participant_id = $2 RETURNING *";
        const { rows } = await pool.query(query, [reportId, participantId]);
        return rows[0];
    }
}

module.exports = Report;
