from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class FraudDetectionService:
    """
    Enhanced fraud detection service with real AI model integration
    Calculates fraud risk score based on multiple factors
    """
    
    def calculate_fraud_score(
        self,
        detection_result: Dict,
        exif_data: Optional[Dict],
        location: Optional[Dict]
    ) -> Tuple[float, List[str]]:
        """
        Calculate comprehensive fraud score using real AI results
        
        Args:
            detection_result: Real object detection results from MobileNetV2
            exif_data: EXIF metadata from image
            location: GPS location data
            
        Returns:
            Tuple of (fraud_score, indicators)
        """
        fraud_score = 0.0
        indicators = []
        
        # Factor 1: AI Detection Confidence (35% weight)
        confidence = detection_result.get('confidence', 0)
        if confidence < 50:
            fraud_score += 35
            indicators.append('Very low AI confidence - objects unclear or suspicious')
        elif confidence < 70:
            fraud_score += 20
            indicators.append('Low AI confidence - image quality issues')
        elif confidence < 85:
            fraud_score += 10
            indicators.append('Moderate AI confidence')
        
        # Factor 2: Object Relevance Check (20% weight)
        objects = detection_result.get('objects', [])
        relevant_objects = [obj for obj in objects if obj.get('relevant', False)]
        
        if len(relevant_objects) == 0:
            fraud_score += 20
            indicators.append('No loan-relevant objects detected in image')
        elif len(relevant_objects) < 2 and len(objects) > 5:
            fraud_score += 10
            indicators.append('Few relevant objects detected')
        
        # Factor 3: Image Quality Analysis (15% weight)
        quality_metrics = detection_result.get('quality_metrics', {})
        quality_score = quality_metrics.get('quality_score', 50)
        
        if quality_score < 40:
            fraud_score += 15
            indicators.append('Poor image quality - possible manipulation')
        elif quality_score < 60:
            fraud_score += 8
            indicators.append('Below average image quality')
        
        if not quality_metrics.get('is_sharp', True):
            fraud_score += 5
            indicators.append('Image is blurry or out of focus')
        
        if not quality_metrics.get('is_well_lit', True):
            fraud_score += 5
            indicators.append('Image has poor lighting conditions')
        
        # Factor 4: EXIF Data Validation (15% weight)
        if exif_data:
            exif_issues = self._validate_exif_data(exif_data)
            fraud_score += exif_issues['score']
            indicators.extend(exif_issues['indicators'])
        else:
            fraud_score += 15
            indicators.append('No EXIF metadata - possible edited image')
        
        # Factor 5: Location Validation (10% weight)
        if location and exif_data and exif_data.get('gps'):
            location_match = self._validate_location(location, exif_data['gps'])
            if not location_match:
                fraud_score += 10
                indicators.append('GPS location mismatch between app and image')
        elif not location:
            fraud_score += 5
            indicators.append('No location data provided')
        
        # Factor 6: Timestamp Validation (5% weight)
        if exif_data and exif_data.get('dateTime'):
            timestamp_issues = self._validate_timestamp(exif_data['dateTime'])
            fraud_score += timestamp_issues['score']
            indicators.extend(timestamp_issues['indicators'])
        
        # Cap at 100
        fraud_score = min(fraud_score, 100.0)
        
        # Add summary indicator
        risk_level = self.get_risk_level(fraud_score)
        logger.info(f'Calculated fraud score: {fraud_score:.1f}% ({risk_level} risk)')
        
        return fraud_score, indicators
    
    def _validate_exif_data(self, exif_data: Dict) -> Dict:
        """
        Validate EXIF metadata for signs of manipulation
        
        Args:
            exif_data: EXIF metadata dictionary
            
        Returns:
            Dictionary with score and indicators
        """
        score = 0.0
        indicators = []
        
        # Check if EXIF appears modified
        if exif_data.get('modified', False):
            score += 10
            indicators.append('EXIF data shows signs of modification')
        
        # Check for missing GPS data
        if not exif_data.get('gps'):
            score += 5
            indicators.append('No GPS coordinates in image metadata')
        
        # Check for missing camera info
        if not exif_data.get('make') and not exif_data.get('model'):
            score += 5
            indicators.append('Missing camera information in metadata')
        
        return {'score': score, 'indicators': indicators}
    
    def _validate_timestamp(self, exif_timestamp: str) -> Dict:
        """
        Validate EXIF timestamp for anomalies
        
        Args:
            exif_timestamp: Timestamp from EXIF data
            
        Returns:
            Dictionary with score and indicators
        """
        score = 0.0
        indicators = []
        
        try:
            # Parse timestamp (format: "YYYY:MM:DD HH:MM:SS")
            if isinstance(exif_timestamp, str):
                timestamp = datetime.strptime(exif_timestamp, "%Y:%m:%d %H:%M:%S")
            else:
                timestamp = exif_timestamp
            
            now = datetime.now()
            
            # Check if timestamp is in the future
            if timestamp > now:
                score += 5
                indicators.append('Image timestamp is in the future')
            
            # Check if timestamp is too old (>1 year)
            elif timestamp < (now - timedelta(days=365)):
                score += 3
                indicators.append('Image is more than 1 year old')
            
            # Check if timestamp is suspiciously recent (< 1 minute)
            elif timestamp > (now - timedelta(minutes=1)):
                # This is actually good - means fresh photo
                pass
                
        except Exception as e:
            score += 2
            indicators.append(f'Could not parse timestamp')
            logger.warning(f'Timestamp parsing error: {str(e)}')
        
        return {'score': score, 'indicators': indicators}
    
    def _validate_location(
        self,
        reported_location: Dict,
        exif_location: Dict
    ) -> bool:
        """
        Validate if reported location matches EXIF GPS data using Haversine formula
        
        Args:
            reported_location: Location from app
            exif_location: Location from EXIF
            
        Returns:
            True if locations match within threshold
        """
        try:
            from math import radians, sin, cos, sqrt, atan2
            
            lat1 = radians(reported_location.get('latitude', 0))
            lon1 = radians(reported_location.get('longitude', 0))
            lat2 = radians(exif_location.get('latitude', 0))
            lon2 = radians(exif_location.get('longitude', 0))
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            
            # Earth's radius in kilometers
            R = 6371.0
            distance_km = R * c
            
            # Threshold: 1km (accounts for GPS accuracy variations)
            threshold_km = 1.0
            
            is_valid = distance_km <= threshold_km
            logger.info(f'Location distance: {distance_km:.2f}km (threshold: {threshold_km}km)')
            
            return is_valid
            
        except Exception as e:
            logger.error(f'Location validation error: {str(e)}')
            return True  # Assume valid if calculation fails
    
    def get_risk_level(self, fraud_score: float) -> str:
        """
        Determine risk level based on fraud score with enhanced thresholds
        
        Args:
            fraud_score: Calculated fraud score (0-100)
            
        Returns:
            Risk level: 'low', 'medium', 'high', or 'critical'
        """
        if fraud_score < 20:
            return 'low'
        elif fraud_score < 40:
            return 'medium'
        elif fraud_score < 70:
            return 'high'
        else:
            return 'critical'
    
    def get_recommendation(self, fraud_score: float) -> str:
        """
        Get verification recommendation based on fraud score
        
        Args:
            fraud_score: Calculated fraud score (0-100)
            
        Returns:
            Recommendation string
        """
        risk_level = self.get_risk_level(fraud_score)
        
        recommendations = {
            'low': 'Verification can proceed. Low fraud risk detected.',
            'medium': 'Additional verification recommended. Some suspicious indicators found.',
            'high': 'Manual review required. Multiple fraud indicators detected.',
            'critical': 'Reject or escalate immediately. High fraud risk detected.'
        }
        
        return recommendations.get(risk_level, 'Manual review recommended.')
