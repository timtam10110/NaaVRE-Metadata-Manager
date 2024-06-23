from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
from waitress import serve
import json
import requests

app = Flask(__name__)
# Allow CORS from any localhost port, as jupyterlab is localhost, but may not always use port 8888. (Localhost is generally safe, anyway)
CORS(app, resources={r"/*": {"origins": "http://localhost:*"}})

client = MongoClient('mongodb://localhost:27017/')
db = client['test-database']
collection = db['test-collection']
inserted_id = None

def push_to_mongodb(data):
    global inserted_id
    inserted_id = collection.insert_one(data).inserted_id


@app.route('/')
def home():
    return "API is running"


@app.route('/api/data', methods=['GET'])
def get_data():
    data = {"message": "Data retrieved successfully"}
    return jsonify(data)


@app.route('/api/insert', methods=['POST'])
def insert_data():
    try:
        json_data = request.get_json()
        print(json_data)
        push_to_mongodb(json_data)
        data = {
            "message": "Data inserted successfully",
            "id": str(inserted_id),
            "data": json.loads(json_util.dumps(collection.find_one({"_id": inserted_id})))
        }
        return jsonify(data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    serve(app, host='localhost', port=5000)
