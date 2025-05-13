from flask import Flask, request, jsonify, render_template, g
import json
import requests
import sqlite3
from datetime import datetime

app = Flask(__name__)

TIINGO_API_KEY = "b3a84c5fa8598c4202d1a168a27ef831f7d41e2f"

DATABASE = 'search_history.db'


@app.route('/')
def index():
  return render_template('index.html')

@app.route('/get_stock_data')
def get_stock_data():
  ticker = request.args.get('ticker')
  if not ticker:
    return jsonify({'error': 'No ticker provided'}), 400
    
  url = f"https://api.tiingo.com/tiingo/daily/{ticker}?token={TIINGO_API_KEY}"
  resp = requests.get(url)
  
  if resp.status_code != 200:
    return jsonify({'error': 'No record has been found, please enter a valid symbol.'}), 500
    
  data = resp.json()
  save_search(data.get('ticker', ''))
  return jsonify({
    'name': data.get('name', ''),
    'ticker': data.get('ticker', ''),
    'exchangeCode': data.get('exchangeCode', ''),
    'startDate': data.get('startDate', ''),
    'description': '\n'.join(data.get('description', '').split('\n')[:5])
  })
  
@app.route('/get_stock_summary')
def get_stock_summary():
  ticker = request.args.get('ticker')
  if not ticker:
    return jsonify({'error': 'No ticker provided'}), 400
    
  url = f"https://api.tiingo.com/iex/{ticker}?token={TIINGO_API_KEY}"
  resp = requests.get(url)
  
  if resp.status_code != 200:
    return jsonify({'error': 'No record has been found, please enter a valid symbol.'}), 500
    
  data = resp.json()
  if isinstance(data, list) and len(data) > 0:
    info = data[0]
    last = info.get('tngoLast', '')
    prevClose = info.get('prevClose', '')
    change = None
    changep = None
    
    if last is not None and prevClose is not None:
      change = round(float(last) - float(prevClose), 2)
      changep = round((change / prevClose) * 100, 2)
      
    return jsonify({
      'ticker': info.get('ticker', ''),
      'date': info.get('timestamp', '').split('T')[0],
      'prevClose': prevClose,
      'open': info.get('open', ''),
      'high': info.get('high', ''),
      'low': info.get('low', ''),
      'last': last,
      'change': change if change is not None else "N/A",
      'changep': changep if changep is not None else "N/A",
      'volume': info.get('volume', '')
    })
  else:
    return jsonify({'error': 'No data returned for ticker'})
    
@app.route('/history')
def history():
  db = get_db()
  cursor = db.cursor()
  cursor.execute("SELECT ticker, timestamp FROM SearchHistory ORDER BY timestamp DESC LIMIT 10")
  rows = cursor.fetchall()
  return jsonify([{'ticker': r[0], 'timestamp': r[1]} for r in rows])

def get_db():
  db = getattr(g, '_database', None)
  if db is None:
    db = g._database = sqlite3.connect(DATABASE)
  return db
  
@app.teardown_appcontext
def close_connection(exception):
  db = getattr(g, '_database', None)
  if db:
    db.close()
    
def save_search(ticker):
  db = get_db()
  cursor = db.cursor()
  cursor.execute("INSERT INTO SearchHistory (ticker) VALUES (?)", (ticker,))
  db.commit()