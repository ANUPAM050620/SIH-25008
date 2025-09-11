
#!/bin/bash

# SIH25008 - Disaster Education System Demo Script

echo "================================================="
echo "  Smart India Hackathon 2025 - SIH25008"
echo "  Disaster Preparedness Education System"
echo "  Government of Punjab"
echo "================================================="
echo ""

echo "🚀 Starting Disaster Education System Demo..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"
echo ""

# Start the services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check database
if docker-compose ps | grep -q "disaster_ed_db.*Up"; then
    echo "✅ Database service is running"
else
    echo "❌ Database service failed to start"
fi

# Check backend
if docker-compose ps | grep -q "disaster_ed_backend.*Up"; then
    echo "✅ Backend service is running"
else
    echo "❌ Backend service failed to start"
fi

# Check nginx
if docker-compose ps | grep -q "disaster_ed_nginx.*Up"; then
    echo "✅ Web server is running"
else
    echo "❌ Web server failed to start"
fi

echo ""
echo "🌐 Application URLs:"
echo "   Web Application: http://localhost"
echo "   API Documentation: http://localhost:5000/api"
echo "   Database: localhost:5432"
echo ""

echo "👤 Demo Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""

echo "📱 Features to Test:"
echo "   • Interactive learning modules"
echo "   • Emergency alert system"
echo "   • Assessment and certification"
echo "   • Progress tracking"
echo "   • Emergency protocols"
echo ""

echo "🛠️  Useful Commands:"
echo "   Stop services:     docker-compose down"
echo "   View logs:         docker-compose logs -f"
echo "   Restart:           docker-compose restart"
echo "   Clean rebuild:     docker-compose down -v && docker-compose up -d --build"
echo ""

echo "📋 Demo Complete! The system is now running."
echo "   Open your browser and go to: http://localhost"
echo "================================================="
