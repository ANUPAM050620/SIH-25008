
# SIH25008 - Disaster Preparedness Education System
## Project Structure

```
disaster-education-system/
│
├── Backend/
│   ├── disaster_education_backend.py    # Main Flask application
│   ├── database_schema.sql              # Database schema
│   ├── requirements.txt                 # Python dependencies
│   └── sample_educational_content.json  # Sample learning content
│
├── Frontend/
│   ├── index.html                       # Main HTML page
│   ├── style.css                        # Stylesheet
│   └── script.js                        # JavaScript functionality
│
├── Deployment/
│   ├── docker-compose.yml               # Docker orchestration
│   ├── Dockerfile.backend               # Backend container
│   └── nginx.conf                       # Web server config
│
└── Documentation/
    └── README.md                        # Complete documentation
```

## Quick Start Commands

1. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Access Application:**
   - Web App: http://localhost
   - API: http://localhost:5000/api

3. **Default Login:**
   - Username: admin
   - Password: admin123

## Key Technologies Used

- **Backend:** Python Flask, PostgreSQL, Redis
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Deployment:** Docker, Nginx
- **Features:** PWA, Real-time alerts, Gamification

## Solution Highlights

✅ Interactive disaster preparedness modules
✅ Real-time emergency alert system  
✅ Assessment and certification system
✅ Multi-language support (English, Hindi, Punjabi)
✅ Mobile-responsive design
✅ Role-based access control
✅ Progress tracking and analytics
✅ Emergency protocol management
✅ Gamified learning experience
✅ Offline capability with PWA
