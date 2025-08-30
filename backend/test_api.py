#!/usr/bin/env python3
"""
Test API Response Script
Test the /api/halls endpoint
"""

import requests
import json

def test_halls_api():
    try:
        print("Testing /api/halls endpoint...")
        
        # Test the API endpoint
        response = requests.get('http://localhost:5000/api/halls')
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Number of halls returned: {len(data['data'])}")
            
            print("\nHall details:")
            for hall in data['data']:
                print(f"   - {hall['name']} (ID: {hall['id']})")
                print(f"     Location: {hall['location']}")
                print(f"     Capacity: {hall['capacity']}")
                print(f"     Available: {hall['isAvailable']}")
                print(f"     Status: {hall['availabilityStatus']}")
                print()
        else:
            print(f"API request failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to Flask server. Make sure the server is running on localhost:5000")
    except Exception as e:
        print(f"Error testing API: {e}")

if __name__ == '__main__':
    test_halls_api()