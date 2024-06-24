from flask import Flask, jsonify
import psycopg2

app = Flask(__name__)

def get_stops():
    conn = psycopg2.connect(database="Searchbar", user="postgres", password="Test1", host="localhost", port="5432")
    cursor = conn.cursor()
    cursor.execute("SELECT name, ST_X(geometry), ST_Y(geometry) FROM tlm_haltestelle")
    stops = cursor.fetchall()
    conn.close()
    return [{"name": stop[0], "lon": stop[1], "lat": stop[2]} for stop in stops]

@app.route('/stops', methods=['GET'])
def stops():
    return jsonify(get_stops())

if __name__ == '__main__':
    app.run(debug=True)
