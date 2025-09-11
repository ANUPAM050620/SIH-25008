
# Disaster Preparedness and Response Education System - Backend API
# Framework: Flask with SQLAlchemy
# Database: PostgreSQL/SQLite

from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///disaster_education.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-string'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # student, teacher, admin, coordinator
    institution_id = db.Column(db.Integer, db.ForeignKey('institution.id'), nullable=False)
    grade_level = db.Column(db.String(10))  # For students
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

class Institution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # school, college
    address = db.Column(db.Text)
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    emergency_contact = db.Column(db.String(20))
    capacity = db.Column(db.Integer)
    users = db.relationship('User', backref='institution', lazy=True)

class DisasterType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(30))  # natural, man-made, health, security
    severity_levels = db.Column(db.Text)  # JSON array of severity levels
    description = db.Column(db.Text)
    icon_url = db.Column(db.String(200))

class EducationalModule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    disaster_type_id = db.Column(db.Integer, db.ForeignKey('disaster_type.id'))
    target_audience = db.Column(db.String(50))  # primary, secondary, college
    content_type = db.Column(db.String(20))  # video, interactive, quiz, simulation
    content_url = db.Column(db.String(300))
    duration_minutes = db.Column(db.Integer)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    prerequisites = db.Column(db.Text)  # JSON array of required modules

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('educational_module.id'), nullable=False)
    status = db.Column(db.String(20))  # not_started, in_progress, completed, certified
    progress_percentage = db.Column(db.Float, default=0.0)
    time_spent_minutes = db.Column(db.Integer, default=0)
    score = db.Column(db.Float)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    certification_date = db.Column(db.DateTime)

class EmergencyProtocol(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    disaster_type_id = db.Column(db.Integer, db.ForeignKey('disaster_type.id'))
    institution_type = db.Column(db.String(20))  # school, college, both
    protocol_steps = db.Column(db.Text)  # JSON array of steps
    evacuation_routes = db.Column(db.Text)  # JSON array of routes
    assembly_points = db.Column(db.Text)  # JSON array of safe points
    emergency_contacts = db.Column(db.Text)  # JSON array of contacts
    resources_needed = db.Column(db.Text)  # JSON array of resources
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    disaster_type_id = db.Column(db.Integer, db.ForeignKey('disaster_type.id'))
    severity_level = db.Column(db.String(20))  # low, medium, high, critical
    institution_id = db.Column(db.Integer, db.ForeignKey('institution.id'))
    target_audience = db.Column(db.String(100))  # all, students, teachers, specific_grade
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('educational_module.id'))
    questions = db.Column(db.Text)  # JSON array of questions
    passing_score = db.Column(db.Float, default=70.0)
    time_limit_minutes = db.Column(db.Integer, default=30)
    max_attempts = db.Column(db.Integer, default=3)
    is_certification = db.Column(db.Boolean, default=False)

class UserAssessmentAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessment.id'), nullable=False)
    attempt_number = db.Column(db.Integer, default=1)
    answers = db.Column(db.Text)  # JSON array of answers
    score = db.Column(db.Float)
    passed = db.Column(db.Boolean)
    time_taken_minutes = db.Column(db.Integer)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

# API Routes

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        access_token = create_access_token(
            identity=user.user_id,
            additional_claims={
                'role': user.role,
                'institution_id': user.institution_id,
                'username': user.username
            }
        )

        return jsonify({
            'access_token': access_token,
            'user': {
                'user_id': user.user_id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'institution_id': user.institution_id,
                'grade_level': user.grade_level
            }
        }), 200

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    required_fields = ['username', 'email', 'password', 'role', 'institution_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data['role'],
        institution_id=data['institution_id'],
        grade_level=data.get('grade_level')
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully', 'user_id': user.user_id}), 201

@app.route('/api/modules', methods=['GET'])
@jwt_required()
def get_modules():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(user_id=current_user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get modules appropriate for user's level
    target_audience = 'primary' if user.grade_level in ['1', '2', '3', '4', '5'] else 'secondary'
    if user.role != 'student':
        target_audience = 'college'

    modules = EducationalModule.query.filter_by(
        target_audience=target_audience, 
        is_active=True
    ).all()

    module_list = []
    for module in modules:
        # Get user's progress for this module
        progress = UserProgress.query.filter_by(
            user_id=user.id, 
            module_id=module.id
        ).first()

        module_data = {
            'id': module.id,
            'title': module.title,
            'description': module.description,
            'content_type': module.content_type,
            'duration_minutes': module.duration_minutes,
            'language': module.language,
            'progress': {
                'status': progress.status if progress else 'not_started',
                'progress_percentage': progress.progress_percentage if progress else 0,
                'score': progress.score if progress else None
            }
        }
        module_list.append(module_data)

    return jsonify({'modules': module_list}), 200

@app.route('/api/modules/<int:module_id>/start', methods=['POST'])
@jwt_required()
def start_module(module_id):
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(user_id=current_user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    module = EducationalModule.query.get(module_id)
    if not module:
        return jsonify({'error': 'Module not found'}), 404

    # Check if progress already exists
    progress = UserProgress.query.filter_by(user_id=user.id, module_id=module_id).first()

    if not progress:
        progress = UserProgress(
            user_id=user.id,
            module_id=module_id,
            status='in_progress',
            started_at=datetime.utcnow()
        )
        db.session.add(progress)
    else:
        progress.status = 'in_progress'
        if not progress.started_at:
            progress.started_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Module started successfully',
        'module': {
            'id': module.id,
            'title': module.title,
            'content_url': module.content_url,
            'content_type': module.content_type
        }
    }), 200

@app.route('/api/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(user_id=current_user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get active alerts for user's institution
    alerts = Alert.query.filter_by(
        institution_id=user.institution_id,
        is_active=True
    ).filter(
        Alert.expires_at > datetime.utcnow()
    ).order_by(Alert.created_at.desc()).all()

    alert_list = []
    for alert in alerts:
        alert_data = {
            'id': alert.alert_id,
            'title': alert.title,
            'message': alert.message,
            'severity_level': alert.severity_level,
            'created_at': alert.created_at.isoformat(),
            'expires_at': alert.expires_at.isoformat() if alert.expires_at else None
        }
        alert_list.append(alert_data)

    return jsonify({'alerts': alert_list}), 200

@app.route('/api/protocols', methods=['GET'])
@jwt_required()
def get_protocols():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(user_id=current_user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Determine institution type
    institution = Institution.query.get(user.institution_id)
    institution_type = institution.type if institution else 'school'

    protocols = EmergencyProtocol.query.filter(
        (EmergencyProtocol.institution_type == institution_type) |
        (EmergencyProtocol.institution_type == 'both')
    ).all()

    protocol_list = []
    for protocol in protocols:
        protocol_data = {
            'id': protocol.id,
            'title': protocol.title,
            'protocol_steps': json.loads(protocol.protocol_steps) if protocol.protocol_steps else [],
            'evacuation_routes': json.loads(protocol.evacuation_routes) if protocol.evacuation_routes else [],
            'assembly_points': json.loads(protocol.assembly_points) if protocol.assembly_points else [],
            'emergency_contacts': json.loads(protocol.emergency_contacts) if protocol.emergency_contacts else []
        }
        protocol_list.append(protocol_data)

    return jsonify({'protocols': protocol_list}), 200

@app.route('/api/assessments/<int:module_id>', methods=['GET'])
@jwt_required()
def get_assessment(module_id):
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(user_id=current_user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    assessment = Assessment.query.filter_by(module_id=module_id).first()

    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    # Check previous attempts
    attempts = UserAssessmentAttempt.query.filter_by(
        user_id=user.id,
        assessment_id=assessment.id
    ).count()

    if attempts >= assessment.max_attempts:
        return jsonify({'error': 'Maximum attempts exceeded'}), 403

    questions = json.loads(assessment.questions) if assessment.questions else []

    # Remove correct answers from questions (for security)
    safe_questions = []
    for q in questions:
        safe_q = {
            'id': q.get('id'),
            'question': q.get('question'),
            'options': q.get('options', []),
            'type': q.get('type', 'multiple_choice')
        }
        safe_questions.append(safe_q)

    return jsonify({
        'assessment': {
            'id': assessment.id,
            'title': assessment.title,
            'questions': safe_questions,
            'time_limit_minutes': assessment.time_limit_minutes,
            'attempts_remaining': assessment.max_attempts - attempts
        }
    }), 200

# Initialize database
def init_db():
    db.create_all()

    # Create sample data if tables are empty
    if Institution.query.count() == 0:
        # Sample institution
        institution = Institution(
            name="Punjab Government College",
            type="college",
            address="Chandigarh, Punjab",
            contact_email="contact@punjabcollege.edu",
            contact_phone="+91-172-1234567",
            latitude=30.7333,
            longitude=76.7794,
            emergency_contact="112",
            capacity=2000
        )
        db.session.add(institution)
        db.session.commit()

        # Sample admin user
        admin_user = User(
            username="admin",
            email="admin@punjabcollege.edu",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            institution_id=institution.id
        )
        db.session.add(admin_user)
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
