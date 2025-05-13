import sqlite3

conn = sqlite3.connect('search_history.db')
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS SearchHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")
conn.commit()
conn.close()
