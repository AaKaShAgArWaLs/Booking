from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# MongoDB connection
client = MongoClient('mongodb+srv://aakashrkl1609:admin123@cluster0.2l9cvqp.mongodb.net/')
db = client['booking_system']

# Collections
halls_collection = db['halls']
time_slots_collection = db['time_slots']
bookings_collection = db['bookings']
maintenance_collection = db['maintenance']
admin_users_collection = db['admin_users']
admin_logs_collection = db['admin_logs']

CORS(app)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# API Routes

@app.route('/api/halls', methods=['GET'])
def get_halls():
    try:
        # Show all halls that are active (not deleted), regardless of availability
        halls = list(halls_collection.find({'is_active': True}))
        return jsonify({
            'success': True,
            'data': [{
                'id': str(hall['_id']),
                'name': hall['name'],
                'location': hall['location'],
                'capacity': hall['capacity'],
                'description': hall.get('description', ''),
                'amenities': hall.get('amenities', []),
                'features': hall.get('features', []),
                'color': hall.get('color', '#3498db'),
                'icon': hall.get('icon', '🏛️'),
                'image_url': hall.get('image_url', ''),
                'isAvailable': hall.get('is_available', True),
                'availabilityStatus': 'Available' if hall.get('is_available', True) else 'Unavailable'
            } for hall in halls]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch halls',
            'message': str(e)
        }), 500

@app.route('/api/halls/<hall_id>/timeslots', methods=['GET'])
def get_time_slots(hall_id):
    try:
        date_str = request.args.get('date')
        user_email = request.args.get('userEmail')
        user_phone = request.args.get('userPhone')
        show_all = request.args.get('showAll', 'false').lower() == 'true'
        is_priority = request.args.get('priority', 'false').lower() == 'true'
        
        print(f"=== TIME SLOTS API DEBUG ===")
        print(f"Request args: {dict(request.args)}")
        print(f"is_priority: {is_priority}")
        print(f"show_all: {show_all}")
        print("===============================")
        
        if not date_str:
            date_str = datetime.now().strftime('%Y-%m-%d')
        
        booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Check if hall is available
        hall = halls_collection.find_one({'_id': ObjectId(hall_id)})
        hall_available = hall.get('is_available', True) if hall else False
        
        # Get all active time slots
        time_slots = list(time_slots_collection.find({'is_active': True}))
        
        # Get existing bookings for this hall and date
        existing_bookings = list(bookings_collection.find({
            'hall_id': hall_id,
            'booking_date': date_str,
            'status': {'$in': ['pending', 'approved']}
        }))

        print(f"Existing bookings for hall {hall_id} on {date_str}: {existing_bookings}")
        
        booked_slot_ids = {str(booking['time_slot_id']) for booking in existing_bookings}
        print(f"Booked slot IDs for hall {hall_id} on {date_str}: {booked_slot_ids}")
        # Get user's existing bookings for this date (for double-booking prevention)
        user_bookings = []
        if user_email or user_phone:
            user_query = {}
            if user_email and user_phone:
                user_query['$or'] = [{'email': user_email}, {'phone': user_phone}]
            elif user_email:
                user_query['email'] = user_email
            elif user_phone:
                user_query['phone'] = user_phone
                
            user_query['booking_date'] = date_str
            user_query['status'] = {'$in': ['pending', 'approved']}
            
            user_bookings = list(bookings_collection.find(user_query))
        
        user_booked_slot_ids = {str(booking['time_slot_id']) for booking in user_bookings}
        
        # Get maintenance schedules
        maintenance = list(maintenance_collection.find({
            'hall_id': hall_id,
            'maintenance_date': date_str,
            'is_active': True
        }))
        
        maintenance_slot_ids = {str(m['time_slot_id']) for m in maintenance if 'time_slot_id' in m}
        
        # Build response
        available_slots = []
        for slot in time_slots:
            slot_id = str(slot['_id'])
            is_available = True
            reason = None
            
            # Priority bookings can override all restrictions except hall availability
            if is_priority:
                # Only check if hall is available for priority bookings
                if not hall_available:
                    is_available = False
                    reason = 'Hall is currently unavailable'
                # For priority bookings, show information about existing bookings but don't block
                elif slot_id in booked_slot_ids:
                    reason = 'Currently booked (can override with priority)'
                elif slot_id in maintenance_slot_ids:
                    reason = 'Maintenance scheduled (can override with priority)'
            else:
                # Regular booking restrictions
                if not hall_available:
                    is_available = False
                    reason = 'Hall is currently unavailable'
                elif slot_id in user_booked_slot_ids:
                    is_available = False
                    reason = 'You already have a booking for this time slot'
                elif slot_id in booked_slot_ids and not show_all:
                    is_available = False
                    reason = 'Already booked'
                elif slot_id in maintenance_slot_ids:
                    is_available = False
                    reason = 'Maintenance scheduled'
                elif booking_date.weekday() == 6:  # Sunday restrictions (weekday 6 = Sunday)
                    is_available = False
                    reason = 'Sunday bookings are only available for priority requests'
                elif booking_date.weekday() == 5:  # Saturday restrictions (weekday 5 = Saturday)
                    if slot.get('slot_order', 0) in [1, 2]:  # Early morning slots
                        is_available = False
                        reason = 'Early morning slots not available on Saturdays'
            
            available_slots.append({
                'id': slot_id,
                'time': slot['time'],
                'duration': slot.get('duration', '2 hours'),
                'available': is_available,
                'isAvailable': is_available,
                'reason': reason,
                'date': date_str,
                'hall_id': hall_id
            })
        
        return jsonify({
            'success': True,
            'data': available_slots,
            'message': f'Time slots loaded for {date_str}',
            'hallAvailable': hall_available,
            'requestParams': {
                'hall_id': hall_id,
                'date': date_str
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to load time slots. Please try again.',
            'message': str(e)
        }), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    try:
        print("=== BACKEND DEBUG ===")
        print(f"Received data: {request.json}")
        print(f"Content-Type: {request.headers.get('Content-Type')}")

        data = request.json

        # Validate required fields
        required_fields = ['hall_id', 'time_slot_id', 'requester_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

        # Generate booking ID
        booking_id = f"BK{int(datetime.now().timestamp())}"
        
        # Verify hall and time slot exist
        hall = halls_collection.find_one({'_id': ObjectId(data['hall_id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(data['time_slot_id'])})
        
        if not hall:
            return jsonify({"success": False, "error": "Hall not found"}), 404
        if not time_slot:
            return jsonify({"success": False, "error": "Time slot not found"}), 404

        # Check for Sunday booking restriction (regular bookings only)
        booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
        if booking_date.weekday() == 6:  # Sunday (weekday 6 = Sunday)
            return jsonify({
                "success": False, 
                "error": "Sunday bookings are not available for regular requests. Please contact admin for priority booking."
            }), 403

        # Check if slot is already booked
        existing_booking = bookings_collection.find_one({
            'hall_id': data['hall_id'],
            'time_slot_id': data['time_slot_id'], 
            'booking_date': data['booking_date'],
            'status': {'$in': ['pending', 'approved']}
        })
        
        if existing_booking:
            return jsonify({
                "success": False, 
                "error": "Time slot is already booked for this date"
            }), 409

        # Create booking document
        booking_doc = {
            'booking_id': booking_id,
            'hall_id': data['hall_id'],
            'time_slot_id': data['time_slot_id'],
            'booking_date': data['booking_date'],
            'name': data['requester_name'],
            'email': data['email'],
            'phone': data.get('phone', ''),
            'organization': data.get('organization', ''),
            'event_title': data['event_title'],
            'description': data.get('purpose', ''),
            'attendees': int(data['attendees']),
            'status': 'pending',
            'submitted_at': datetime.utcnow(),
            'approved_at': None,
            'approved_by': None,
            'rejection_reason': None,
            'priority_booking': False,
            'notes': data.get('notes', '')
        }

        # Insert booking into database
        result = bookings_collection.insert_one(booking_doc)
        
        print(f"Booking created successfully: {booking_id}")
        
        # Return success response
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'booking_id': booking_id,
                'status': 'pending',
                'hall_name': hall['name'],
                'time_slot': time_slot['time'],
                'booking_date': data['booking_date']
            },
            'message': 'Booking request submitted successfully!'
        }), 201

    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
    
@app.route('/api/bookings', methods=['GET'])
def get_all_bookings():
    try:
        bookings = list(bookings_collection.find().sort('submitted_at', -1))
        
        result_bookings = []
        for booking in bookings:
            # Get hall details
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
            
            result_bookings.append({
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'hall': {
                    'id': str(hall['_id']) if hall else booking['hall_id'],
                    'name': hall['name'] if hall else 'Unknown Hall',
                    'location': hall['location'] if hall else ''
                },
                'timeSlot': time_slot['time'] if time_slot else 'Unknown Time',
                'booking_date': booking['booking_date'],
                'name': booking['name'],
                'email': booking['email'],
                'phone': booking['phone'],
                'organization': booking.get('organization', ''),
                'eventTitle': booking['event_title'],
                'description': booking.get('description', ''),
                'attendees': booking['attendees'],
                'status': booking['status'],
                'submittedAt': booking['submitted_at'].isoformat(),
                'approvedAt': booking['approved_at'].isoformat() if booking.get('approved_at') else None,
                'approvedBy': booking.get('approved_by'),
                'rejectionReason': booking.get('rejection_reason')
            })
        
        return jsonify({
            'success': True,
            'data': result_bookings
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch bookings',
            'message': str(e)
        }), 500

@app.route('/api/bookings/user-bookings', methods=['GET'])
def get_user_bookings_for_date():
    try:
        date_str = request.args.get('date')
        user_email = request.args.get('userEmail')
        user_phone = request.args.get('userPhone')
        user_id = request.args.get('userId')
        
        if not date_str:
            return jsonify({
                'success': False,
                'error': 'Date parameter is required'
            }), 400
        
        # Build query for user identification
        user_query = {'booking_date': date_str, 'status': {'$in': ['pending', 'approved']}}
        
        if user_id:
            user_query['user_id'] = user_id
        elif user_email and user_phone:
            user_query['$or'] = [{'email': user_email}, {'phone': user_phone}]
        elif user_email:
            user_query['email'] = user_email
        elif user_phone:
            user_query['phone'] = user_phone
        else:
            return jsonify({
                'success': False,
                'error': 'User identification required (email, phone, or userId)'
            }), 400
        
        # Find user's bookings for this date
        user_bookings = list(bookings_collection.find(user_query))
        
        # Format response with hall and time slot details
        result_bookings = []
        for booking in user_bookings:
            # Get hall details
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
            
            result_bookings.append({
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'hall_id': booking['hall_id'],
                'time_slot_id': booking['time_slot_id'],
                'start_time': time_slot.get('start_time') if time_slot else None,
                'end_time': time_slot.get('end_time') if time_slot else None,
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'time_slot_name': time_slot['time'] if time_slot else 'Unknown Time',
                'booking_date': booking['booking_date'],
                'status': booking['status'],
                'event_title': booking.get('event_title', ''),
                'submitted_at': booking['submitted_at'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': result_bookings,
            'message': f'Found {len(result_bookings)} booking(s) for {date_str}'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to check existing bookings',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>/approve', methods=['PUT'])
def approve_booking(booking_id):
    try:
        result = bookings_collection.update_one(
            {'booking_id': booking_id},
            {
                '$set': {
                    'status': 'approved',
                    'approved_at': datetime.utcnow(),
                    'approved_by': 'Admin'  # In real app, get from auth
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        booking = bookings_collection.find_one({'booking_id': booking_id})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'status': booking['status']
            },
            'message': 'Booking approved successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to approve booking',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>/reject', methods=['PUT'])
def reject_booking(booking_id):
    try:
        data = request.get_json()
        
        result = bookings_collection.update_one(
            {'booking_id': booking_id},
            {
                '$set': {
                    'status': 'rejected',
                    'rejection_reason': data.get('reason', 'No reason provided')
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        booking = bookings_collection.find_one({'booking_id': booking_id})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'status': booking['status']
            },
            'message': 'Booking rejected'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to reject booking',
            'message': str(e)
        }), 500

@app.route('/api/bookings/<booking_id>', methods=['GET'])
def get_booking_details(booking_id):
    try:
        booking = bookings_collection.find_one({'booking_id': booking_id})
        if not booking:
            return jsonify({
                'success': False,
                'error': 'Booking not found'
            }), 404
        
        # Get hall and time slot details
        hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(booking['_id']),
                'booking_id': booking['booking_id'],
                'hall': {
                    'id': str(hall['_id']) if hall else booking['hall_id'],
                    'name': hall['name'] if hall else 'Unknown Hall',
                    'location': hall['location'] if hall else '',
                    'capacity': hall['capacity'] if hall else 0
                },
                'timeSlot': time_slot['time'] if time_slot else 'Unknown Time',
                'booking_date': booking['booking_date'],
                'name': booking['name'],
                'email': booking['email'],
                'phone': booking['phone'],
                'organization': booking.get('organization', ''),
                'eventTitle': booking['event_title'],
                'description': booking.get('description', ''),
                'attendees': booking['attendees'],
                'status': booking['status'],
                'submittedAt': booking['submitted_at'].isoformat(),
                'approvedAt': booking['approved_at'].isoformat() if booking.get('approved_at') else None,
                'approvedBy': booking.get('approved_by'),
                'rejectionReason': booking.get('rejection_reason')
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch booking details',
            'message': str(e)
        }), 500

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        # Get total counts
        total_bookings = bookings_collection.count_documents({})
        total_halls = halls_collection.count_documents({'is_active': True})
        
        # Get status counts
        pending_bookings = bookings_collection.count_documents({'status': 'pending'})
        approved_bookings = bookings_collection.count_documents({'status': 'approved'})
        rejected_bookings = bookings_collection.count_documents({'status': 'rejected'})
        
        # Get today's bookings
        today = datetime.now().strftime('%Y-%m-%d')
        todays_bookings = bookings_collection.count_documents({'booking_date': today})
        
        # Get recent bookings (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        recent_bookings = list(bookings_collection.find({
            'booking_date': {'$gte': week_ago}
        }).sort('submitted_at', -1).limit(5))
        
        # Format recent bookings
        recent_bookings_formatted = []
        for booking in recent_bookings:
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            recent_bookings_formatted.append({
                'booking_id': booking['booking_id'],
                'event_title': booking['event_title'],
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'status': booking['status'],
                'booking_date': booking['booking_date'],
                'submitted_at': booking['submitted_at'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_bookings': total_bookings,
                'total_halls': total_halls,
                'pending_bookings': pending_bookings,
                'approved_bookings': approved_bookings,
                'rejected_bookings': rejected_bookings,
                'todays_bookings': todays_bookings,
                'recent_bookings': recent_bookings_formatted
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard stats',
            'message': str(e)
        }), 500

@app.route('/api/admin/priority-booking', methods=['POST'])
def create_priority_booking():
    try:
        data = request.get_json()
        
        # Generate booking ID with priority prefix
        booking_id = f"PR{int(datetime.now().timestamp())}"
        
        # Get hall and time slot details
        hall = halls_collection.find_one({'_id': ObjectId(data['hall_id'])})
        time_slot = time_slots_collection.find_one({'_id': ObjectId(data['time_slot_id'])})
        
        if not hall or not time_slot:
            return jsonify({
                'success': False,
                'error': 'Invalid hall or time slot'
            }), 400
        
        # Create priority booking document
        booking_doc = {
            'booking_id': booking_id,
            'hall_id': data['hall_id'],
            'time_slot_id': data['time_slot_id'],
            'booking_date': data['booking_date'],
            'name': data['requester_name'],
            'email': data.get('requester_email', 'admin@booking.com'),
            'phone': data.get('requester_phone', 'N/A'),
            'organization': data['department'],
            'event_title': data['purpose'],
            'description': data.get('notes', ''),
            'attendees': int(data.get('attendees', 50)),
            'status': 'approved',  # Priority bookings are auto-approved
            'submitted_at': datetime.utcnow(),
            'approved_at': datetime.utcnow(),
            'approved_by': 'Admin (Priority)',
            'priority_booking': True,
            'rejection_reason': None
        }
        
        result = bookings_collection.insert_one(booking_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'booking_id': booking_id,
                'status': 'approved',
                'hall_name': hall['name'],
                'time_slot': time_slot['time']
            },
            'message': 'Priority booking created successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create priority booking',
            'message': str(e)
        }), 500


@app.route('/api/admin/halls', methods=['POST'])
def create_hall():
    try:
        data = request.get_json()
        
        hall_doc = {
            'name': data['name'],
            'location': data['location'],
            'capacity': int(data['capacity']),
            'description': data.get('description', ''),
            'amenities': data.get('amenities', []),
            'features': data.get('features', []),
            'color': data.get('color', '#3498db'),
            'icon': data.get('icon', '🏛️'),
            'image_url': data.get('image_url', ''),
            'is_available': True,
            'is_active': True,
            'created_at': datetime.utcnow()
        }
        
        result = halls_collection.insert_one(hall_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'name': data['name'],
                'location': data['location']
            },
            'message': 'Hall created successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create hall',
            'message': str(e)
        }), 500

@app.route('/api/admin/halls/<hall_id>', methods=['PUT'])
def update_hall(hall_id):
    try:
        data = request.get_json()
        
        update_doc = {}
        if 'name' in data:
            update_doc['name'] = data['name']
        if 'location' in data:
            update_doc['location'] = data['location']
        if 'capacity' in data:
            update_doc['capacity'] = int(data['capacity'])
        if 'description' in data:
            update_doc['description'] = data['description']
        if 'amenities' in data:
            update_doc['amenities'] = data['amenities']
        if 'features' in data:
            update_doc['features'] = data['features']
        if 'is_active' in data:
            update_doc['is_active'] = data['is_active']
        
        update_doc['updated_at'] = datetime.utcnow()
        
        result = halls_collection.update_one(
            {'_id': ObjectId(hall_id)},
            {'$set': update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Hall not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Hall updated successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update hall',
            'message': str(e)
        }), 500

@app.route('/api/admin/halls/<hall_id>/toggle', methods=['PUT'])
def toggle_hall_status(hall_id):
    try:
        hall = halls_collection.find_one({'_id': ObjectId(hall_id)})
        if not hall:
            return jsonify({
                'success': False,
                'error': 'Hall not found'
            }), 404
        
        new_status = not hall.get('is_available', True)
        
        halls_collection.update_one(
            {'_id': ObjectId(hall_id)},
            {'$set': {'is_available': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True,
            'data': {
                'hall_id': hall_id,
                'is_available': new_status
            },
            'message': f'Hall {"activated" if new_status else "deactivated"} successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to toggle hall status',
            'message': str(e)
        }), 500

@app.route('/api/admin/maintenance', methods=['POST'])
def schedule_maintenance():
    try:
        data = request.get_json()
        
        maintenance_doc = {
            'hall_id': data['hall_id'],
            'maintenance_date': data['maintenance_date'],
            'time_slot_id': data.get('time_slot_id'),  # Optional - can be None for full day
            'reason': data.get('reason', 'Scheduled maintenance'),
            'is_active': True,
            'created_at': datetime.utcnow(),
            'created_by': 'Admin'
        }
        
        result = maintenance_collection.insert_one(maintenance_doc)
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'maintenance_date': data['maintenance_date']
            },
            'message': 'Maintenance scheduled successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to schedule maintenance',
            'message': str(e)
        }), 500

@app.route('/api/admin/maintenance', methods=['GET'])
def get_maintenance_schedules():
    try:
        maintenance_schedules = list(maintenance_collection.find({'is_active': True}))
        
        formatted_schedules = []
        for schedule in maintenance_schedules:
            hall = halls_collection.find_one({'_id': ObjectId(schedule['hall_id'])})
            time_slot = None
            if schedule.get('time_slot_id'):
                time_slot = time_slots_collection.find_one({'_id': ObjectId(schedule['time_slot_id'])})
            
            formatted_schedules.append({
                'id': str(schedule['_id']),
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'maintenance_date': schedule['maintenance_date'],
                'time_slot': time_slot['time'] if time_slot else 'Full Day',
                'reason': schedule['reason'],
                'created_at': schedule['created_at'].isoformat()
            })
        
        return jsonify({
            'success': True,
            'data': formatted_schedules
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch maintenance schedules',
            'message': str(e)
        }), 500

# Admin Authentication Routes

@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Find admin user
        admin = admin_users_collection.find_one({
            'email': email,
            'is_active': True
        })
        
        if not admin:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Check password (in production, use proper password hashing)
        if admin['password'] != password:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Update last login
        admin_users_collection.update_one(
            {'_id': admin['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        
        # Log admin login
        admin_logs_collection.insert_one({
            'admin_id': str(admin['_id']),
            'action': 'LOGIN',
            'details': {
                'admin_name': admin['name'],
                'admin_email': admin['email'],
                'login_time': datetime.utcnow().isoformat()
            },
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        })
        
        # Return admin data (excluding password)
        return jsonify({
            'success': True,
            'data': {
                'id': str(admin['_id']),
                'name': admin['name'],
                'email': admin['email'],
                'role': admin['role'],
                'permissions': admin.get('permissions', []),
                'last_login': admin.get('last_login').isoformat() if admin.get('last_login') else None,
                'created_at': admin.get('created_at', datetime.utcnow()).isoformat()
            },
            'message': f'Welcome back, {admin["name"]}!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Login failed',
            'message': str(e)
        }), 500

@app.route('/api/admin/auth/logout', methods=['POST'])
def admin_logout():
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if admin_id:
            # Log admin logout
            admin = admin_users_collection.find_one({'_id': ObjectId(admin_id)})
            if admin:
                admin_logs_collection.insert_one({
                    'admin_id': admin_id,
                    'action': 'LOGOUT',
                    'details': {
                        'admin_name': admin['name'],
                        'logout_time': datetime.utcnow().isoformat()
                    },
                    'timestamp': datetime.utcnow(),
                    'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
                })
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Logout failed',
            'message': str(e)
        }), 500

# Admin Management Routes

@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    try:
        admins = list(admin_users_collection.find({'is_active': True}))
        
        formatted_admins = []
        for admin in admins:
            formatted_admins.append({
                'id': str(admin['_id']),
                'name': admin['name'],
                'email': admin['email'],
                'role': admin['role'],
                'status': 'active' if admin['is_active'] else 'inactive',
                'last_login': admin.get('last_login').isoformat() if admin.get('last_login') else None,
                'created_at': admin.get('created_at', datetime.utcnow()).isoformat(),
                'permissions': admin.get('permissions', [])
            })
        
        return jsonify({
            'success': True,
            'data': formatted_admins
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch admin users',
            'message': str(e)
        }), 500

@app.route('/api/admin/users', methods=['POST'])
def create_admin_user():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        email = data['email'].lower().strip()
        
        # Check if admin already exists
        existing_admin = admin_users_collection.find_one({'email': email})
        if existing_admin:
            return jsonify({
                'success': False,
                'error': 'Admin with this email already exists'
            }), 409
        
        # Create admin document
        admin_doc = {
            'name': data['name'].strip(),
            'email': email,
            'password': data['password'],  # In production, hash this password
            'role': data['role'].strip(),
            'permissions': data.get('permissions', ['bookings', 'halls']),
            'is_active': True,
            'created_at': datetime.utcnow(),
            'last_login': None
        }
        
        result = admin_users_collection.insert_one(admin_doc)
        
        # Log admin creation
        admin_logs_collection.insert_one({
            'admin_id': 'system',
            'action': 'CREATE_ADMIN',
            'details': {
                'new_admin_name': admin_doc['name'],
                'new_admin_email': admin_doc['email'],
                'new_admin_role': admin_doc['role']
            },
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        })
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(result.inserted_id),
                'name': admin_doc['name'],
                'email': admin_doc['email'],
                'role': admin_doc['role']
            },
            'message': 'Admin user created successfully!'
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create admin user',
            'message': str(e)
        }), 500

@app.route('/api/admin/users/<admin_id>', methods=['PUT'])
def update_admin_user(admin_id):
    try:
        data = request.get_json()
        
        # Find existing admin
        admin = admin_users_collection.find_one({'_id': ObjectId(admin_id)})
        if not admin:
            return jsonify({
                'success': False,
                'error': 'Admin user not found'
            }), 404
        
        # Prepare update document
        update_doc = {}
        if 'name' in data:
            update_doc['name'] = data['name'].strip()
        if 'email' in data:
            email = data['email'].lower().strip()
            # Check if email is already taken by another admin
            existing_admin = admin_users_collection.find_one({
                'email': email,
                '_id': {'$ne': ObjectId(admin_id)}
            })
            if existing_admin:
                return jsonify({
                    'success': False,
                    'error': 'Email is already taken by another admin'
                }), 409
            update_doc['email'] = email
        if 'password' in data and data['password']:
            update_doc['password'] = data['password']  # In production, hash this
        if 'role' in data:
            update_doc['role'] = data['role'].strip()
        if 'permissions' in data:
            update_doc['permissions'] = data['permissions']
        
        update_doc['updated_at'] = datetime.utcnow()
        
        # Update admin
        admin_users_collection.update_one(
            {'_id': ObjectId(admin_id)},
            {'$set': update_doc}
        )
        
        # Log admin update
        admin_logs_collection.insert_one({
            'admin_id': admin_id,
            'action': 'UPDATE_ADMIN',
            'details': {
                'admin_name': admin['name'],
                'updated_fields': list(update_doc.keys())
            },
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        })
        
        return jsonify({
            'success': True,
            'message': 'Admin user updated successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update admin user',
            'message': str(e)
        }), 500

@app.route('/api/admin/users/<admin_id>/toggle', methods=['PUT'])
def toggle_admin_status(admin_id):
    try:
        admin = admin_users_collection.find_one({'_id': ObjectId(admin_id)})
        if not admin:
            return jsonify({
                'success': False,
                'error': 'Admin user not found'
            }), 404
        
        new_status = not admin.get('is_active', True)
        
        admin_users_collection.update_one(
            {'_id': ObjectId(admin_id)},
            {'$set': {'is_active': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        # Log status change
        admin_logs_collection.insert_one({
            'admin_id': admin_id,
            'action': 'TOGGLE_ADMIN_STATUS',
            'details': {
                'admin_name': admin['name'],
                'new_status': 'active' if new_status else 'inactive'
            },
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        })
        
        return jsonify({
            'success': True,
            'data': {
                'admin_id': admin_id,
                'is_active': new_status
            },
            'message': f'Admin {"activated" if new_status else "deactivated"} successfully!'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to toggle admin status',
            'message': str(e)
        }), 500

@app.route('/api/admin/users/<admin_id>', methods=['DELETE'])
def delete_admin_user(admin_id):
    try:
        # Find the admin to get details for logging
        admin = admin_users_collection.find_one({'_id': ObjectId(admin_id)})
        if not admin:
            return jsonify({
                'success': False,
                'error': 'Admin user not found'
            }), 404

        # Delete the admin user
        result = admin_users_collection.delete_one({'_id': ObjectId(admin_id)})

        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'Failed to delete admin user'
            }), 500

        # Log the deletion
        admin_logs_collection.insert_one({
            'admin_id': 'system',
            'action': 'DELETE_ADMIN',
            'details': {
                'deleted_admin_id': admin_id,
                'deleted_admin_name': admin['name'],
                'deleted_admin_email': admin['email'],
                'deleted_admin_role': admin['role']
            },
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        })

        return jsonify({
            'success': True,
            'message': f'Admin user "{admin["name"]}" deleted successfully!'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to delete admin user',
            'message': str(e)
        }), 500
@app.route('/api/admin/logs', methods=['GET'])
def get_admin_logs():
    try:
        # Get recent logs (last 100)
        logs = list(admin_logs_collection.find().sort('timestamp', -1).limit(100))
        
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                'id': str(log['_id']),
                'admin_id': log['admin_id'],
                'action': log['action'],
                'details': log['details'],
                'timestamp': log['timestamp'].isoformat(),
                'ip_address': log.get('ip_address', 'Unknown')
            })
        
        return jsonify({
            'success': True,
            'data': formatted_logs
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch admin logs',
            'message': str(e)
        }), 500

@app.route('/api/admin/logs', methods=['POST'])
def log_admin_action():
    try:
        data = request.get_json()
        
        log_doc = {
            'admin_id': data.get('admin_id', 'unknown'),
            'action': data['action'],
            'details': data.get('details', {}),
            'timestamp': datetime.utcnow(),
            'ip_address': request.environ.get('REMOTE_ADDR', 'Unknown')
        }
        
        admin_logs_collection.insert_one(log_doc)
        
        return jsonify({
            'success': True,
            'message': 'Admin action logged successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to log admin action',
            'message': str(e)
        }), 500

# Report Generation Endpoints

@app.route('/api/admin/reports/bookings', methods=['GET'])
def generate_booking_report():
    try:
        report_type = request.args.get('type', 'pdf')  # 'pdf' or 'excel'
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build query for date range
        query = {}
        if start_date and end_date:
            query['booking_date'] = {'$gte': start_date, '$lte': end_date}
        elif start_date:
            query['booking_date'] = {'$gte': start_date}
        elif end_date:
            query['booking_date'] = {'$lte': end_date}
        else:
            # Default to last 30 days if no date range specified
            from datetime import timedelta
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            query['booking_date'] = {'$gte': start_date, '$lte': end_date}
        
        # Get bookings data
        bookings = list(bookings_collection.find(query).sort('booking_date', -1))
        
        # Enrich with hall and time slot data
        report_data = []
        for booking in bookings:
            hall = halls_collection.find_one({'_id': ObjectId(booking['hall_id'])})
            time_slot = time_slots_collection.find_one({'_id': ObjectId(booking['time_slot_id'])})
            
            report_data.append({
                'booking_id': booking['booking_id'],
                'booking_date': booking['booking_date'],
                'hall_name': hall['name'] if hall else 'Unknown Hall',
                'hall_location': hall['location'] if hall else 'Unknown Location',
                'time_slot': time_slot['time'] if time_slot else 'Unknown Time',
                'requester_name': booking['name'],
                'requester_email': booking['email'],
                'organization': booking.get('organization', ''),
                'event_title': booking['event_title'],
                'attendees': booking['attendees'],
                'status': booking['status'],
                'submitted_at': booking['submitted_at'].strftime('%Y-%m-%d %H:%M:%S'),
                'approved_at': booking['approved_at'].strftime('%Y-%m-%d %H:%M:%S') if booking.get('approved_at') else '',
                'rejection_reason': booking.get('rejection_reason', '')
            })
        
        if report_type.lower() == 'pdf':
            return generate_pdf_report(report_data, 'Booking Report', f'Booking Report ({start_date} to {end_date})')
        else:  # excel
            return generate_excel_report(report_data, 'Booking Report', f'booking-report-{start_date}-to-{end_date}.xlsx')
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate booking report',
            'message': str(e)
        }), 500

@app.route('/api/admin/reports/utilization', methods=['GET'])
def generate_utilization_report():
    try:
        report_type = request.args.get('type', 'pdf')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build query for date range
        query = {}
        if start_date and end_date:
            query['booking_date'] = {'$gte': start_date, '$lte': end_date}
        elif start_date:
            query['booking_date'] = {'$gte': start_date}
        elif end_date:
            query['booking_date'] = {'$lte': end_date}
        else:
            # Default to last 30 days
            from datetime import timedelta
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            query['booking_date'] = {'$gte': start_date, '$lte': end_date}
        
        # Get utilization statistics
        halls = list(halls_collection.find({'is_active': True}))
        time_slots = list(time_slots_collection.find({'is_active': True}))
        
        utilization_data = []
        for hall in halls:
            hall_stats = {
                'hall_name': hall['name'],
                'hall_location': hall['location'],
                'capacity': hall['capacity'],
                'total_bookings': 0,
                'approved_bookings': 0,
                'pending_bookings': 0,
                'rejected_bookings': 0,
                'utilization_rate': 0
            }
            
            # Get bookings for this hall in date range
            hall_query = {**query, 'hall_id': str(hall['_id'])}
            hall_bookings = list(bookings_collection.find(hall_query))
            
            hall_stats['total_bookings'] = len(hall_bookings)
            hall_stats['approved_bookings'] = len([b for b in hall_bookings if b['status'] == 'approved'])
            hall_stats['pending_bookings'] = len([b for b in hall_bookings if b['status'] == 'pending'])
            hall_stats['rejected_bookings'] = len([b for b in hall_bookings if b['status'] == 'rejected'])
            
            # Calculate utilization rate (approved bookings / total possible slots)
            if start_date and end_date:
                from datetime import datetime, timedelta
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                total_days = (end_dt - start_dt).days + 1
                total_possible_slots = total_days * len(time_slots)
                hall_stats['utilization_rate'] = round(
                    (hall_stats['approved_bookings'] / total_possible_slots) * 100, 2
                ) if total_possible_slots > 0 else 0
            
            utilization_data.append(hall_stats)
        
        if report_type.lower() == 'pdf':
            return generate_pdf_report(utilization_data, 'Hall Utilization Report', f'Hall Utilization Report ({start_date} to {end_date})')
        else:  # excel
            return generate_excel_report(utilization_data, 'Utilization Report', f'utilization-report-{start_date}-to-{end_date}.xlsx')
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate utilization report',
            'message': str(e)
        }), 500

def generate_pdf_report(data, title, filename):
    """Generate PDF report (placeholder - requires reportlab library)"""
    try:
        # For now, return JSON data with instructions
        # In production, you would use reportlab or similar to generate actual PDF
        return jsonify({
            'success': True,
            'data': data,
            'message': f'PDF generation not implemented yet. Install reportlab library and implement PDF generation.',
            'filename': f'{filename.replace(" ", "-").lower()}.pdf',
            'contentType': 'application/pdf',
            'total_records': len(data)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate PDF report',
            'message': str(e)
        }), 500

def generate_excel_report(data, title, filename):
    """Generate Excel report (placeholder - requires openpyxl library)"""
    try:
        # For now, return JSON data with instructions
        # In production, you would use openpyxl or pandas to generate actual Excel file
        return jsonify({
            'success': True,
            'data': data,
            'message': f'Excel generation not implemented yet. Install openpyxl library and implement Excel generation.',
            'filename': filename,
            'contentType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'total_records': len(data)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate Excel report',
            'message': str(e)
        }), 500

# Initialize database with sample data
def init_db():
    try:
        # Add sample halls if none exist
        if halls_collection.count_documents({}) == 0:
            halls = [
                {
                    'name': 'Hall A',
                    'location': 'FET Ground Floor',
                    'capacity': 100,
                    'description': 'Located on the ground floor of FET building. Perfect for presentations and seminars with modern amenities.',
                    'amenities': ['Projector', 'AC', 'WiFi', 'Sound System', 'Whiteboard'],
                    'features': ['Projector', 'AC', 'WiFi', 'Sound System', 'Whiteboard'],
                    'color': '#3498db',
                    'icon': '🏛️',
                    'image_url': '',
                    'is_available': True,
                    'is_active': True,
                    'created_at': datetime.utcnow()
                },
                {
                    'name': 'Hall B',
                    'location': 'FET 1st Floor',
                    'capacity': 150,
                    'description': 'Located on the 1st floor of FET building. Spacious hall ideal for conferences and large gatherings.',
                    'amenities': ['Projector', 'AC', 'WiFi', 'Stage', 'Microphones', 'Audio System'],
                    'features': ['Projector', 'AC', 'WiFi', 'Stage', 'Microphones', 'Audio System'],
                    'color': '#2ecc71',
                    'icon': '🎯',
                    'image_url': '',
                    'is_available': True,
                    'is_active': True,
                    'created_at': datetime.utcnow()
                },
                {
                    'name': 'Hall C',
                    'location': 'Core Block',
                    'capacity': 200,
                    'description': 'Located in the Core Block. Premium hall with advanced facilities for major events and conferences.',
                    'amenities': ['Projector', 'AC', 'WiFi', 'Stage', 'Sound System', 'Recording', 'LED Display'],
                    'features': ['Projector', 'AC', 'WiFi', 'Stage', 'Sound System', 'Recording', 'LED Display'],
                    'color': '#e74c3c',
                    'icon': '🏢',
                    'image_url': '',
                    'is_available': True,
                    'is_active': True,
                    'created_at': datetime.utcnow()
                }
            ]
            halls_collection.insert_many(halls)
            print("Sample halls added to database")
        
        # Add sample time slots if none exist
        if time_slots_collection.count_documents({}) == 0:
            slots = [
                {
                    'time': '8:45 AM – 10:45 AM',
                    'duration': '2 hours',
                    'start_time': '08:45',
                    'end_time': '10:45',
                    'slot_order': 1,
                    'is_available': True,
                    'is_active': True
                },
                {
                    'time': '11:00 AM – 01:00 PM',
                    'duration': '2 hours',
                    'start_time': '11:00',
                    'end_time': '13:00',
                    'slot_order': 2,
                    'is_available': True,
                    'is_active': True
                },
                {
                    'time': '01:00 PM – 03:45 PM',
                    'duration': '2 hours 45 minutes',
                    'start_time': '13:00',
                    'end_time': '15:45',
                    'slot_order': 3,
                    'is_available': True,
                    'is_active': True
                },
                {
                    'time': 'Full Day',
                    'duration': '8 hours',
                    'start_time': '08:45',
                    'end_time': '17:00',
                    'slot_order': 4,
                    'is_available': True,
                    'is_active': True
                }
            ]
            time_slots_collection.insert_many(slots)
            print("Sample time slots added to database")
        
        # Add sample admin users if none exist
        if admin_users_collection.count_documents({}) == 0:
            admin_users = [
                {
                    'name': 'Super Admin',
                    'email': 'admin@booking.com',
                    'password': 'admin123',  # In production, hash this password
                    'role': 'Administrator',
                    'permissions': ['all', 'bookings', 'halls', 'users', 'logs'],
                    'is_active': True,
                    'created_at': datetime.utcnow(),
                    'last_login': None
                },
                {
                    'name': 'Placement Admin',
                    'email': 'placement@college.edu',
                    'password': 'place123',
                    'role': 'Placement Officer',
                    'permissions': ['bookings', 'halls'],
                    'is_active': True,
                    'created_at': datetime.utcnow(),
                    'last_login': None
                },
                {
                    'name': 'Head Office Admin',
                    'email': 'headoffice@org.com',
                    'password': 'head123',
                    'role': 'Head Office',
                    'permissions': ['bookings', 'halls', 'users'],
                    'is_active': True,
                    'created_at': datetime.utcnow(),
                    'last_login': None
                },
                {
                    'name': 'Hall Manager',
                    'email': 'manager@booking.com',
                    'password': 'manager123',
                    'role': 'Hall Manager',
                    'permissions': ['halls', 'bookings'],
                    'is_active': True,
                    'created_at': datetime.utcnow(),
                    'last_login': None
                }
            ]
            admin_users_collection.insert_many(admin_users)
            print("Sample admin users added to database")
            print("Admin credentials:")
            for user in admin_users:
                print(f"  - {user['email']} / {user['password']} ({user['role']})")
            
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)