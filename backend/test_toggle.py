#!/usr/bin/env python3
"""
Test Hall Toggle Script
Test making Hall B unavailable to verify the system works
"""

from pymongo import MongoClient
from bson.objectid import ObjectId

def test_toggle():
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
        db = client['booking_system']
        
        halls_collection = db['halls']
        
        print("Testing hall availability toggle...")
        
        # Find Hall B
        hall_b = halls_collection.find_one({'name': 'Hall B'})
        if not hall_b:
            print("Hall B not found!")
            return
            
        print(f"Hall B current status: Available={hall_b.get('is_available', True)}")
        
        # Toggle Hall B to unavailable
        new_status = not hall_b.get('is_available', True)
        result = halls_collection.update_one(
            {'_id': hall_b['_id']},
            {'$set': {'is_available': new_status}}
        )
        
        if result.modified_count > 0:
            status_text = "Available" if new_status else "Unavailable"
            print(f"Successfully updated Hall B to: {status_text}")
            
            # Show all hall statuses
            print("\nAll hall statuses:")
            for hall in halls_collection.find():
                available_status = "Available" if hall.get('is_available', True) else "Unavailable"
                print(f"   - {hall['name']}: {available_status}")
        else:
            print("Failed to update Hall B")
        
        client.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_toggle()