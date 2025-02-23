const pool = require("../config/database");

class HomeworkParticipant {

    static async getAllParticipants(homeworkId) {
        const query = "SELECT * FROM homework_participants WHERE homework_id = $1 ORDER BY created_at DESC";
        const { rows } = await pool.query(query, [homeworkId]);
        return rows;
    }

    static async findById(participanId, homeworkId) {
        const query = "SELECT * FROM homework_participants WHERE participant_id = $1 AND homework_id = $2";
        const { rows } = await pool.query(query, [participanId, homeworkId]);
        return rows[0];
    }

    static async add(participants, homeworkId) {
        const query = "INSERT INTO homework_participants (repo_url, full_name, ssh_key, homework_id) VALUES " +
            participants.map(({ repoUrl, fullName, sshKey }) => 
                `("${repoUrl}", "${fullName}", "${sshKey}", ${homeworkId})`
            ).join(", ") + " RETURNING *";
        
        const { rows } = await pool.query(query);
        return rows[0];
    }    

    static async update(values, participanId, homeworkId) {
        const query = "UPDATE homework_participants\nSET " + values + "\nWHERE participant_id = $1 AND homework_id = $2\nRETURNING *";
        const { rows } = await pool.query(query, [participanId, homeworkId]);
        return rows[0]         
    }

    static async delete(participanId, homeworkId) {
        const query = "DELETE FROM homework_participants WHERE participant_id = $1 AND homework_id = $2 RETURNING *";
        const { rows } = await pool.query(query, [participanId, homeworkId]);
        return rows[0];
    }

    static async checkDuplicates(repoUrls, sshKeys, homeworkId) {
        const query = `
            SELECT full_name 
            FROM homework_participants 
            WHERE homework_id = $1 
            AND (repo_url = ANY($2) OR ssh_key = ANY($3))`;
        
        const { rows } = await pool.query(query, [homeworkId, repoUrls, sshKeys]);
    
        return rows;
    }
}

module.exports = HomeworkParticipant;
