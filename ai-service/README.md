# AI Verification Service

Python-based AI service for fraud detection and media verification.

## Features

- Object detection using TensorFlow Lite
- Fraud score calculation
- Duplicate media detection using perceptual hashing
- EXIF data validation
- GPS location verification

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Run production server
gunicorn --bind 0.0.0.0:8000 --workers 2 app:app
```

## API Endpoints

### POST /api/verify

Verify media with AI detection.

**Request:**
```json
{
  "mediaUrl": "https://...",
  "mediaType": "image",
  "exifData": {...},
  "location": {"latitude": 0, "longitude": 0}
}
```

**Response:**
```json
{
  "success": true,
  "confidenceScore": 92.5,
  "detectedObjects": [...],
  "fraudScore": 15.0,
  "fraudIndicators": [],
  "modelVersion": "1.0.0"
}
```

### POST /api/check-duplicate

Check for duplicate media.

**Request:**
```json
{
  "mediaUrl": "https://..."
}
```

**Response:**
```json
{
  "isDuplicate": false,
  "similarSubmissions": null
}
```

## Model Integration

To integrate your own TensorFlow Lite models:

1. Place `.tflite` model files in `models/` directory
2. Update `ObjectDetectionService` in `services/object_detection.py`
3. Implement inference logic in `_run_inference()` method

## Environment Variables

```
FLASK_ENV=development
PORT=8000
AI_SERVICE_API_KEY=your-api-key
```
