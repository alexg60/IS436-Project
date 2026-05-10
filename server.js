const express = require("express");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT));

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicUserFields() {
  return "user_id, full_name, email, role, department_id";
}

const fallbackUsers = {
  "admin@example.com": {
    user_id: 9991,
    full_name: "Summit Ridge Admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    department_id: 1
  },
  "user@example.com": {
    user_id: 9992,
    full_name: "Summit Ridge User",
    email: "user@example.com",
    password: "user123",
    role: "employee",
    department_id: 4
  }
};

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${publicUserFields()}
     FROM users
     WHERE LOWER(email) = ? AND is_active = TRUE
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function requireAdmin(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, role
     FROM users
     WHERE user_id = ? AND is_active = TRUE
     LIMIT 1`,
    [userId]
  );

  if (!rows[0] || rows[0].role !== "admin") {
    const error = new Error("Only admins can perform this action.");
    error.statusCode = 403;
    throw error;
  }

  return rows[0];
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (email) {
      return res.json(await findUserByEmail(email));
    }

    const [rows] = await pool.query(
      `SELECT ${publicUserFields()}
       FROM users
       WHERE is_active = TRUE
       ORDER BY full_name`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const fallbackUser = fallbackUsers[email];

    if (fallbackUser && fallbackUser.password === password) {
      const databaseUser = await findUserByEmail(email);
      if (databaseUser) {
        return res.json(databaseUser);
      }

      return res.json({
        user_id: fallbackUser.user_id,
        full_name: fallbackUser.full_name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        department_id: fallbackUser.department_id
      });
    }

    try {
      const [rows] = await pool.query(
        `SELECT ${publicUserFields()}
         FROM users
         WHERE LOWER(email) = ? AND password = ? AND is_active = TRUE
         LIMIT 1`,
        [email, password]
      );

      if (!rows[0]) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      return res.json(rows[0]);
    } catch (error) {
      if (error && error.code === "ER_BAD_FIELD_ERROR") {
        if (fallbackUser && fallbackUser.password === password) {
          return res.json({
            user_id: fallbackUser.user_id,
            full_name: fallbackUser.full_name,
            email: fallbackUser.email,
            role: fallbackUser.role,
            department_id: fallbackUser.department_id
          });
        }
        return res.status(401).json({ error: "Invalid email or password." });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT category_id, category_name
       FROM categories
       ORDER BY category_name`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/assets", async (req, res) => {
  const requesterId = Number(req.query.user_id);
  if (!requesterId) {
    return res.status(400).json({ error: "user_id is required." });
  }

  try {
    await requireAdmin(requesterId);

    const [rows] = await pool.query(
      `SELECT
         a.asset_id,
         a.asset_name,
         a.device_type,
         a.make_model,
         a.serial_number,
         a.purchase_date,
         a.warranty_expiry,
         a.store_location,
         a.status,
         u.full_name AS assigned_to_name
       FROM assets a
       LEFT JOIN users u ON u.user_id = a.assigned_to
       ORDER BY a.asset_name`
    );

    res.json(rows);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/assets", async (req, res) => {
  const requesterId = Number(req.body.created_by);

  try {
    await requireAdmin(requesterId);

    const {
      asset_name,
      device_type,
      make_model,
      serial_number,
      purchase_date,
      warranty_expiry,
      assigned_to,
      store_location,
      status
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO assets (
         asset_name,
         device_type,
         make_model,
         serial_number,
         purchase_date,
         warranty_expiry,
         assigned_to,
         store_location,
         status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_name,
        device_type,
        make_model || null,
        serial_number || null,
        purchase_date || null,
        warranty_expiry || null,
        assigned_to ? Number(assigned_to) : null,
        store_location || null,
        status || "Active"
      ]
    );

    const [rows] = await pool.query(
      `SELECT asset_id, asset_name, device_type, status
       FROM assets
       WHERE asset_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/licenses", async (req, res) => {
  const requesterId = Number(req.query.user_id);
  if (!requesterId) {
    return res.status(400).json({ error: "user_id is required." });
  }

  try {
    await requireAdmin(requesterId);

    const [rows] = await pool.query(
      `SELECT
         license_id,
         software_name,
         vendor,
         total_seats,
         seats_in_use,
         expiry_date,
         purchased_date,
         notes
       FROM licenses
       ORDER BY software_name`
    );

    res.json(rows);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.post("/api/licenses", async (req, res) => {
  const requesterId = Number(req.body.created_by);

  try {
    await requireAdmin(requesterId);

    const {
      software_name,
      vendor,
      license_key,
      total_seats,
      seats_in_use,
      expiry_date,
      purchased_date,
      notes
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO licenses (
         software_name,
         vendor,
         license_key,
         total_seats,
         seats_in_use,
         expiry_date,
         purchased_date,
         notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        software_name,
        vendor || null,
        license_key || null,
        total_seats ? Number(total_seats) : 1,
        seats_in_use ? Number(seats_in_use) : 0,
        expiry_date || null,
        purchased_date || null,
        notes || null
      ]
    );

    const [rows] = await pool.query(
      `SELECT license_id, software_name, total_seats, seats_in_use, expiry_date
       FROM licenses
       WHERE license_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.patch("/api/licenses/:licenseId", async (req, res) => {
  const licenseId = Number(req.params.licenseId);
  const requesterId = Number(req.body.updated_by);
  const totalSeats = Number(req.body.total_seats);
  const seatsInUse = Number(req.body.seats_in_use);

  if (!licenseId || !requesterId) {
    return res.status(400).json({ error: "licenseId and updated_by are required." });
  }

  if (!Number.isInteger(totalSeats) || !Number.isInteger(seatsInUse) || totalSeats < 0 || seatsInUse < 0) {
    return res.status(400).json({ error: "Seat counts must be whole numbers of zero or more." });
  }

  if (seatsInUse > totalSeats) {
    return res.status(400).json({ error: "Seats in use cannot be greater than total seats." });
  }

  try {
    await requireAdmin(requesterId);

    const [result] = await pool.query(
      `UPDATE licenses
       SET total_seats = ?,
           seats_in_use = ?
       WHERE license_id = ?`,
      [totalSeats, seatsInUse, licenseId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "License not found." });
    }

    const [rows] = await pool.query(
      `SELECT
         license_id,
         software_name,
         vendor,
         total_seats,
         seats_in_use,
         expiry_date,
         purchased_date,
         notes
       FROM licenses
       WHERE license_id = ?`,
      [licenseId]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/api/tickets", async (req, res) => {
  try {
    const filters = [];
    const params = [];

    if (req.query.user_id) {
      filters.push("(t.submitted_by = ? OR t.assigned_to = ?)");
      params.push(Number(req.query.user_id), Number(req.query.user_id));
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT
         t.ticket_id,
         t.title,
         t.description,
         t.priority,
         t.status,
         t.store_location,
         t.device_type,
         t.device_id,
         t.created_at,
         t.updated_at,
         t.submitted_by,
         t.assigned_to,
         c.category_name,
         submitter.full_name AS submitted_by_name,
         assignee.full_name AS assigned_to_name
       FROM tickets t
       JOIN categories c ON c.category_id = t.category_id
       JOIN users submitter ON submitter.user_id = t.submitted_by
       LEFT JOIN users assignee ON assignee.user_id = t.assigned_to
       ${whereClause}
       ORDER BY t.updated_at DESC, t.ticket_id DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      priority,
      submitted_by,
      assigned_to,
      store_location,
      device_type,
      device_id
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO tickets (
         title,
         description,
         category_id,
         priority,
         submitted_by,
         assigned_to,
         store_location,
         device_type,
         device_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        Number(category_id),
        priority,
        Number(submitted_by),
        assigned_to ? Number(assigned_to) : null,
        store_location || null,
        device_type || null,
        device_id || null
      ]
    );

    const [rows] = await pool.query(
      `SELECT ticket_id, title, status, priority, created_at
       FROM tickets
       WHERE ticket_id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/tickets/:ticketId/status", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const changedBy = Number(req.body.changed_by);
  const newStatus = String(req.body.status || "").trim();

  if (!ticketId || !changedBy || !newStatus) {
    return res.status(400).json({ error: "ticketId, changed_by, and status are required." });
  }

  try {
    const [adminRows] = await pool.query(
      `SELECT user_id, role
       FROM users
       WHERE user_id = ? AND is_active = TRUE
       LIMIT 1`,
      [changedBy]
    );

    if (!adminRows[0] || adminRows[0].role !== "admin") {
      return res.status(403).json({ error: "Only admins can update ticket statuses." });
    }

    const [ticketRows] = await pool.query(
      `SELECT ticket_id, status
       FROM tickets
       WHERE ticket_id = ?
       LIMIT 1`,
      [ticketId]
    );

    if (!ticketRows[0]) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const oldStatus = ticketRows[0].status;

    await pool.query(
      `UPDATE tickets
       SET status = ?,
           closed_at = CASE
             WHEN ? IN ('Resolved', 'Closed') THEN CURRENT_TIMESTAMP
             ELSE NULL
           END
       WHERE ticket_id = ?`,
      [newStatus, newStatus, ticketId]
    );

    await pool.query(
      `INSERT INTO ticket_status (ticket_id, changed_by, old_status, new_status)
       VALUES (?, ?, ?, ?)`,
      [ticketId, changedBy, oldStatus, newStatus]
    );

    const [rows] = await pool.query(
      `SELECT ticket_id, status, updated_at, closed_at
       FROM tickets
       WHERE ticket_id = ?`,
      [ticketId]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tickets/:ticketId", async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const requesterId = Number(req.query.user_id);

  if (!ticketId || !requesterId) {
    return res.status(400).json({ error: "ticketId and user_id are required." });
  }

  try {
    await requireAdmin(requesterId);

    await pool.query(
      `DELETE FROM comments
       WHERE ticket_id = ?`,
      [ticketId]
    );

    await pool.query(
      `DELETE FROM ticket_status
       WHERE ticket_id = ?`,
      [ticketId]
    );

    const [result] = await pool.query(
      `DELETE FROM tickets
       WHERE ticket_id = ?`,
      [ticketId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.delete("/api/assets/:assetId", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const requesterId = Number(req.query.user_id);

  if (!assetId || !requesterId) {
    return res.status(400).json({ error: "assetId and user_id are required." });
  }

  try {
    await requireAdmin(requesterId);

    const [result] = await pool.query(
      `DELETE FROM assets
       WHERE asset_id = ?`,
      [assetId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Asset not found." });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT, "summit_ridge_it_ticketing_homepage.html"));
});

app.listen(PORT, () => {
  console.log(`Summit Ridge portal running at http://localhost:${PORT}`);
});
