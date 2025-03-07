const pool = require("../config/database");

class Report { 
    static async getAllByParticipant(participantId) { // TODO
        const query = "SELECT * FROM reports WHERE participant_id = $1 ORDER BY updated_at DESC";
        const { rows } = await pool.query(query, [participantId]);
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

    static async update(title, reportId, participantId) {
        const query = `
            UPDATE reports 
            SET title = $1
            WHERE report_id = $2 AND participant_id = $3
            RETURNING *`;
        const { rows } = await pool.query(query, [title, reportId, participantId]);
        return rows[0];
    }

    static async delete(reportId, participantId) {
        const query = "DELETE FROM reports WHERE report_id = $1 AND participant_id = $2 RETURNING *";
        const { rows } = await pool.query(query, [reportId, participantId]);
        return rows[0];
    }
}

module.exports = Report;
