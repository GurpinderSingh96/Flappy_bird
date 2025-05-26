from flask import Flask, render_template, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/models/<path:filename>')
def serve_models(filename):
    return send_from_directory(os.path.join(app.static_folder, 'models'), filename)

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
