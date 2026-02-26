const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../config/logger');

class DatabaseService {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '..', 'data', 'agents.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    logger.error('Database connection error:', err);
                    reject(err);
                } else {
                    logger.info('Database connected');
                    this.initTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(`CREATE TABLE IF NOT EXISTS agents (
                    AgentID TEXT PRIMARY KEY,
                    Name TEXT,
                    UserName TEXT,
                    Comp_Name TEXT,
                    Nationality TEXT,
                    CreatedDate TEXT,
                    LastLogin TEXT,
                    data TEXT
                )`, (err) => err && logger.error('Create agents table error:', err));

                this.db.run(`CREATE TABLE IF NOT EXISTS logins (
                    ID INTEGER PRIMARY KEY,
                    AGENTID TEXT,
                    LOGINDATE TEXT,
                    data TEXT,
                    FOREIGN KEY(AGENTID) REFERENCES agents(AgentID)
                )`, (err) => err && logger.error('Create logins table error:', err));

                this.db.run(`CREATE INDEX IF NOT EXISTS idx_agent_username ON agents(UserName)`, (err) => err && logger.error('Create index error:', err));
                this.db.run(`CREATE INDEX IF NOT EXISTS idx_agent_company ON agents(Comp_Name)`, (err) => err && logger.error('Create index error:', err));
                this.db.run(`CREATE INDEX IF NOT EXISTS idx_login_agentid ON logins(AGENTID)`, (err) => {
                    if (err) {
                        logger.error('Create index error:', err);
                        reject(err);
                    } else {
                        logger.info('Database tables initialized');
                        resolve();
                    }
                });
            });
        });
    }

    async insertAgent(agent) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`INSERT OR REPLACE INTO agents VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            stmt.run(
                agent.AgentID, agent.Name, agent.UserName, agent.Comp_Name,
                agent.Nationality, agent.CreatedDate, agent.LastLogin, JSON.stringify(agent),
                (err) => err ? reject(err) : resolve()
            );
            stmt.finalize();
        });
    }

    async insertLogin(login) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`INSERT OR REPLACE INTO logins VALUES (?, ?, ?, ?)`);
            stmt.run(login.ID, login.AGENTID, login.LOGINDATE, JSON.stringify(login), (err) => err ? reject(err) : resolve());
            stmt.finalize();
        });
    }

    async getAgent(agentID) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT data FROM agents WHERE AgentID = ?`, [agentID], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.data) : null);
            });
        });
    }

    async getLoginsByAgent(agentID) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT data FROM logins WHERE AGENTID = ?`, [agentID], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => JSON.parse(r.data)) : []);
            });
        });
    }

    async getAllAgents() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT data FROM agents`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => JSON.parse(r.data)) : []);
            });
        });
    }

    async getAllLogins() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT data FROM logins`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows ? rows.map(r => JSON.parse(r.data)) : []);
            });
        });
    }

    /**
     * Pre-compute analytics for fast query responses
     * @returns {Object} Analytics data
     */
    async preComputeAnalytics() {
        const analytics = {};

        try {
            // Total agents per company
            analytics.agentsByCompany = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT Comp_Name, COUNT(*) as count 
                    FROM agents 
                    GROUP BY Comp_Name 
                    ORDER BY count DESC
                `, [], (err, rows) => err ? reject(err) : resolve(rows || []));
            });

            // Total agents per nationality
            analytics.agentsByNationality = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT Nationality, COUNT(*) as count 
                    FROM agents 
                    GROUP BY Nationality 
                    ORDER BY count DESC
                `, [], (err, rows) => err ? reject(err) : resolve(rows || []));
            });

            // Most active agents (by login count)
            analytics.mostActiveAgents = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT a.AgentID, a.Name, a.Comp_Name, COUNT(l.ID) as loginCount
                    FROM agents a 
                    LEFT JOIN logins l ON a.AgentID = l.AGENTID
                    GROUP BY a.AgentID 
                    ORDER BY loginCount DESC 
                    LIMIT 10
                `, [], (err, rows) => err ? reject(err) : resolve(rows || []));
            });

            // Agents with no logins
            analytics.neverLoggedIn = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT a.AgentID, a.Name, a.Comp_Name
                    FROM agents a
                    LEFT JOIN logins l ON a.AgentID = l.AGENTID
                    WHERE l.ID IS NULL
                `, [], (err, rows) => err ? reject(err) : resolve(rows || []));
            });

            // Recent logins (last 30 days)
            analytics.recentLogins = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT a.AgentID, a.Name, MAX(l.LOGINDATE) as lastLogin
                    FROM agents a
                    JOIN logins l ON a.AgentID = l.AGENTID
                    WHERE l.LOGINDATE >= date('now', '-30 days')
                    GROUP BY a.AgentID 
                    ORDER BY lastLogin DESC
                `, [], (err, rows) => err ? reject(err) : resolve(rows || []));
            });

            logger.info('Analytics pre-computed successfully');
            return analytics;
        } catch (error) {
            logger.error('Analytics pre-computation error:', error);
            return {};
        }
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => err ? reject(err) : resolve());
        });
    }
}

module.exports = new DatabaseService();
