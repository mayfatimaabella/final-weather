import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root',
})
export class SQLiteService {
  private db: SQLiteDBConnection | any;

  async createDatabase() {
    try {
      const db = await CapacitorSQLite.createConnection({
        database: 'weather_app',
        version: 1,
        encrypted: false,
        mode: 'no-encryption',
      });
      this.db = db;

      await this.db.open();

      // Create weather table
      const createWeatherTable = `
        CREATE TABLE IF NOT EXISTS weather (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT,
          data TEXT,
          timestamp INTEGER
        );
      `;
      await this.db.execute(createWeatherTable);

      // Create preferences table
      const createPreferencesTable = `
        CREATE TABLE IF NOT EXISTS preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          value TEXT
        );
      `;
      await this.db.execute(createPreferencesTable);

      console.log('Database and tables created successfully.');
    } catch (error) {
      console.error('Error creating database:', error);
    }
  }

  async saveWeatherData(location: string, data: string) {
    if (!this.db) return;

    const timestamp = Date.now();
    const query = `
      INSERT INTO weather (location, data, timestamp)
      VALUES (?, ?, ?);
    `;
    try {
      await this.db.run(query, [location, data, timestamp]);
      console.log('Weather data saved successfully.');
    } catch (error) {
      console.error('Error saving weather data:', error);
    }
  }

  async getWeatherData(location: string): Promise<any> {
    if (!this.db) return null;

    const query = `
      SELECT data FROM weather
      WHERE location = ?
      ORDER BY timestamp DESC
      LIMIT 1;
    `;
    try {
      const result = await this.db.query(query, [location]);
      return result.values.length > 0 ? JSON.parse(result.values[0].data) : null;
    } catch (error) {
      console.error('Error retrieving weather data:', error);
      return null;
    }
  }

  async savePreference(key: string, value: string) {
    if (!this.db) return;

    const query = `
      INSERT OR REPLACE INTO preferences (key, value)
      VALUES (?, ?);
    `;
    try {
      await this.db.run(query, [key, value]);
      console.log(`Preference [${key}] saved successfully.`);
    } catch (error) {
      console.error(`Error saving preference [${key}]:`, error);
    }
  }

  async getPreference(key: string): Promise<string | null> {
    if (!this.db) return null;

    const query = `
      SELECT value FROM preferences
      WHERE key = ?;
    `;
    try {
      const result = await this.db.query(query, [key]);
      console.log(`Preference [${key}] retrieved:`, result.values);
      return result.values.length > 0 ? result.values[0].value : null;
    } catch (error) {
      console.error(`Error retrieving preference [${key}]:`, error);
      return null;
    }
  }
}
