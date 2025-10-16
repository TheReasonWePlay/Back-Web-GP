import db from '../../config/db';

export interface CalendarHoliday {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
}

export const CalendarHolidayModel = {
  async findAll(): Promise<CalendarHoliday[]> {
    const [rows]: any = await db.query(`
      SELECT 
        id_jour_ferie AS id,
        titre AS name,
        date AS date,
        recurent AS recurring
      FROM jour_ferie
      ORDER BY date ASC
    `);
    return rows;
  },

  async findById(id: string): Promise<CalendarHoliday | null> {
    const [rows]: any = await db.query(`
      SELECT 
        id_jour_ferie AS id,
        titre AS name,
        date AS date,
        recurent AS recurring
      FROM jour_ferie
      WHERE id_jour_ferie = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data: CalendarHoliday): Promise<string> {
    const { name, date, recurring } = data;
    const [result]: any = await db.query(
      `INSERT INTO jour_ferie (titre, date, recurent) VALUES (?, ?, ?)`,
      [name, date, recurring]
    );
    return String(result.insertId);
  },

  async update(id: string, data: Partial<CalendarHoliday>): Promise<void> {
    const { name, date, recurring } = data;
    await db.query(
      `UPDATE jour_ferie SET titre = ?, date = ?, recurent = ? WHERE id_jour_ferie = ?`,
      [name, date, recurring, id]
    );
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM jour_ferie WHERE id_jour_ferie = ?`, [id]);
  },
};
