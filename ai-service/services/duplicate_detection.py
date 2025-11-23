import imagehash
from PIL import Image
import requests
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

class DuplicateDetectionService:
    """
    Duplicate detection using perceptual hashing
    """
    
    def __init__(self):
        # In production, store hashes in Redis or database
        self.hash_store = {}
    
    def check_duplicate(self, media_url: str) -> dict:
        """
        Check if media is a duplicate
        
        Args:
            media_url: URL of the media file
            
        Returns:
            Dictionary with duplicate check results
        """
        try:
            # Download image
            response = requests.get(media_url, timeout=10)
            image = Image.open(BytesIO(response.content))
            
            # Calculate perceptual hash
            image_hash = imagehash.average_hash(image)
            hash_str = str(image_hash)
            
            # Check against stored hashes
            is_duplicate = hash_str in self.hash_store
            similar_submissions = []
            
            if is_duplicate:
                similar_submissions = self.hash_store[hash_str]
            
            # Store hash (in production, use Redis/DB)
            if not is_duplicate:
                self.hash_store[hash_str] = [media_url]
            else:
                self.hash_store[hash_str].append(media_url)
            
            return {
                'isDuplicate': is_duplicate,
                'similarSubmissions': similar_submissions if is_duplicate else None
            }
            
        except Exception as e:
            logger.error(f'Duplicate check error: {str(e)}')
            return {
                'isDuplicate': False,
                'error': str(e)
            }
    
    def find_similar(self, media_url: str, threshold: int = 5) -> list:
        """
        Find similar images using hamming distance
        
        Args:
            media_url: URL of the media file
            threshold: Maximum hamming distance for similarity
            
        Returns:
            List of similar media URLs
        """
        try:
            response = requests.get(media_url, timeout=10)
            image = Image.open(BytesIO(response.content))
            query_hash = imagehash.average_hash(image)
            
            similar = []
            for stored_hash_str, urls in self.hash_store.items():
                stored_hash = imagehash.hex_to_hash(stored_hash_str)
                distance = query_hash - stored_hash
                
                if distance <= threshold:
                    similar.extend(urls)
            
            return similar
            
        except Exception as e:
            logger.error(f'Similar search error: {str(e)}')
            return []
