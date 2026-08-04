import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from services import geotechnical_service

# Load environment variables
load_dotenv()

# App configuration
PORT = int(os.environ.get('PORT', 5000))
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
MODEL_API_URL = os.environ.get('MODEL_API_URL', 'http://127.0.0.1:8000')
LLM_API_KEY = os.environ.get('LLM_API_KEY', '')

# Initialize Flask. The static_folder points to '../dist' where Vite builds
app = Flask(__name__, static_folder='../dist', static_url_path='/')
CORS(app)

# API Routes
@app.route('/api/segments', methods=['GET'])
def get_segments():
    segments = geotechnical_service.get_segments()
    if segments is None:
        return jsonify({"error": "Segments data not found"}), 404
    return jsonify(segments)

@app.route('/api/projects', methods=['GET'])
def get_projects():
    return jsonify(geotechnical_service.get_projects())

@app.route('/api/layers', methods=['GET'])
def get_layers():
    return jsonify(geotechnical_service.get_layers())

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify(geotechnical_service.get_system_status())

@app.route('/api/support-matrix', methods=['GET'])
def get_support_matrix():
    matrix = geotechnical_service.get_support_matrix()
    if matrix is None:
        return jsonify({"error": "Support matrix not found"}), 404
    return jsonify(matrix)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = geotechnical_service.get_recommendation_categories()
    if categories is None:
        return jsonify({"error": "Categories not found"}), 404
    return jsonify(categories)

@app.route('/api/upload', methods=['POST'])
def mock_upload():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    file = request.files['file']
    return jsonify({
        "success": True, 
        "filename": file.filename, 
        "message": "File received successfully (mock)"
    })

@app.route('/api/download', methods=['GET'])
def mock_download():
    return jsonify({
        "success": True,
        "download_url": "/api/download/file.json",
        "message": "Ready for download (mock)"
    })

# Serve Frontend static routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=(FLASK_ENV == 'development'))
