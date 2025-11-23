from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from services.object_detection import ObjectDetectionService
from services.fraud_detection import FraudDetectionService
from services.duplicate_detection import DuplicateDetectionService
import logging

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
object_detector = ObjectDetectionService()
fraud_detector = FraudDetectionService()
duplicate_detector = DuplicateDetectionService()

# API Key authentication
API_KEY = os.getenv('AI_SERVICE_API_KEY', 'default-api-key')

def verify_api_key():
    """Verify API key from request headers"""
    api_key = request.headers.get('X-API-Key')
    return api_key == API_KEY

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Verification Service',
        'version': '1.0.0'
    }), 200

@app.route('/api/verify', methods=['POST'])
def verify_media():
    """
    Verify media submission with AI
    
    Request body:
    {
        "mediaUrl": "https://...",
        "mediaType": "image" | "video",
        "exifData": {...},
        "location": {"latitude": 0, "longitude": 0}
    }
    """
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        media_url = data.get('mediaUrl')
        media_type = data.get('mediaType', 'image')
        exif_data = data.get('exifData')
        location = data.get('location')
        
        if not media_url:
            return jsonify({'error': 'mediaUrl is required'}), 400
        
        # Perform object detection
        detection_result = object_detector.detect(media_url, media_type)
        
        # Calculate fraud score
        fraud_score, indicators = fraud_detector.calculate_fraud_score(
            detection_result,
            exif_data,
            location
        )
        
        # Prepare response
        response = {
            'success': True,
            'confidenceScore': detection_result['confidence'],
            'detectedObjects': detection_result['objects'],
            'fraudScore': fraud_score,
            'fraudIndicators': indicators,
            'modelVersion': detection_result['model_version']
        }
        
        logger.info(f'Verification completed for {media_url}')
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f'Verification error: {str(e)}')
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/api/check-duplicate', methods=['POST'])
def check_duplicate():
    """
    Check if media is duplicate
    
    Request body:
    {
        "mediaUrl": "https://..."
    }
    """
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        media_url = data.get('mediaUrl')
        
        if not media_url:
            return jsonify({'error': 'mediaUrl is required'}), 400
        
        # Check for duplicates
        result = duplicate_detector.check_duplicate(media_url)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f'Duplicate check error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
