
// Disaster Preparedness Education System - Frontend JavaScript

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    TOKEN_KEY: 'disaster_ed_token',
    USER_KEY: 'disaster_ed_user',
    REFRESH_INTERVAL: 300000 // 5 minutes
};

// Global state
let currentUser = null;
let authToken = null;
let currentModule = null;
let assessmentTimer = null;

// Utility Functions
class Utils {
    static formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static showLoading(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    static showError(message, containerId = 'login-error') {
        const errorDiv = document.getElementById(containerId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    static showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 3000;
            animation: slideInDown 0.3s ease;
        `;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// API Service
class ApiService {
    static async makeRequest(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (authToken) {
            defaultHeaders.Authorization = `Bearer ${authToken}`;
        }

        try {
            const response = await fetch(url, {
                headers: { ...defaultHeaders, ...options.headers },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    static async login(username, password) {
        return await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static async getModules() {
        return await this.makeRequest('/modules');
    }

    static async startModule(moduleId) {
        return await this.makeRequest(`/modules/${moduleId}/start`, {
            method: 'POST'
        });
    }

    static async getAlerts() {
        return await this.makeRequest('/alerts');
    }

    static async getProtocols() {
        return await this.makeRequest('/protocols');
    }

    static async getAssessment(moduleId) {
        return await this.makeRequest(`/assessments/${moduleId}`);
    }

    static async submitAssessment(assessmentId, answers) {
        return await this.makeRequest(`/assessments/${assessmentId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    }
}

// Authentication Manager
class AuthManager {
    static init() {
        // Check for stored auth token
        authToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const storedUser = localStorage.getItem(CONFIG.USER_KEY);

        if (authToken && storedUser) {
            currentUser = JSON.parse(storedUser);
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    static showLogin() {
        document.getElementById('login-modal').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
    }

    static showMainApp() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        App.init();
    }

    static async handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            Utils.showError('Please enter both username and password');
            return;
        }

        try {
            const response = await ApiService.login(username, password);

            authToken = response.access_token;
            currentUser = response.user;

            // Store in localStorage
            localStorage.setItem(CONFIG.TOKEN_KEY, authToken);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser));

            this.showMainApp();
            Utils.showSuccess(`Welcome back, ${currentUser.username}!`);

        } catch (error) {
            Utils.showError(error.message);
        }
    }

    static logout() {
        // Clear stored data
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);

        authToken = null;
        currentUser = null;

        this.showLogin();
        Utils.showSuccess('Logged out successfully');
    }
}

// Main Application
class App {
    static async init() {
        this.setupNavigation();
        this.loadDashboardData();
        this.startPeriodicUpdates();
    }

    static setupNavigation() {
        // Navigation event listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                if (target) {
                    this.navigateToSection(target);
                }
            });
        });

        // Hamburger menu toggle
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    }

    static navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Close mobile menu
        document.getElementById('nav-menu').classList.remove('active');
        document.getElementById('hamburger').classList.remove('active');

        // Load section-specific data
        switch (sectionId) {
            case 'modules':
                ModuleManager.loadModules();
                break;
            case 'protocols':
                ProtocolManager.loadProtocols();
                break;
            case 'alerts':
                AlertManager.loadAlerts();
                break;
            case 'progress':
                ProgressManager.loadProgress();
                break;
        }
    }

    static async loadDashboardData() {
        try {
            // Load basic stats (mock data for now)
            this.updateDashboardStats({
                modulesCompleted: 8,
                certificationsEarned: 3,
                timeSpentMinutes: 240,
                achievementScore: 750
            });

            // Load and check for alerts
            await AlertManager.checkForAlerts();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    static updateDashboardStats(stats) {
        document.getElementById('modules-completed').textContent = stats.modulesCompleted;
        document.getElementById('certifications-earned').textContent = stats.certificationsEarned;
        document.getElementById('time-spent').textContent = Utils.formatTime(stats.timeSpentMinutes);
        document.getElementById('achievement-score').textContent = stats.achievementScore;
    }

    static startPeriodicUpdates() {
        // Check for new alerts every 5 minutes
        setInterval(() => {
            AlertManager.checkForAlerts();
        }, CONFIG.REFRESH_INTERVAL);
    }
}

// Module Manager
class ModuleManager {
    static async loadModules() {
        Utils.showLoading('modules-grid');

        try {
            const response = await ApiService.getModules();
            this.renderModules(response.modules);
        } catch (error) {
            console.error('Failed to load modules:', error);
            document.getElementById('modules-grid').innerHTML = `
                <div class="error-message">
                    Failed to load modules. Please try again later.
                </div>
            `;
        }
    }

    static renderModules(modules) {
        const grid = document.getElementById('modules-grid');

        if (!modules || modules.length === 0) {
            grid.innerHTML = `
                <div class="no-data">
                    <h3>No modules available</h3>
                    <p>Check back later for new learning content.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = modules.map(module => `
            <div class="module-card" data-module-id="${module.id}">
                <div class="module-header">
                    <h3>${module.title}</h3>
                    <span class="module-type">${module.content_type}</span>
                </div>
                <div class="module-body">
                    <p>${module.description}</p>
                    <div class="module-meta">
                        <span><i class="fas fa-clock"></i> ${Utils.formatTime(module.duration_minutes)}</span>
                        <span><i class="fas fa-language"></i> ${module.language.toUpperCase()}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${module.progress.progress_percentage}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="progress-text">${module.progress.progress_percentage.toFixed(0)}% Complete</span>
                        <button class="btn btn-primary" onclick="ModuleManager.startModule(${module.id})">
                            ${module.progress.status === 'not_started' ? 'Start' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    static async startModule(moduleId) {
        try {
            const response = await ApiService.startModule(moduleId);
            currentModule = response.module;
            this.openModulePlayer(currentModule);
            Utils.showSuccess('Module started successfully!');
        } catch (error) {
            Utils.showError('Failed to start module: ' + error.message);
        }
    }

    static openModulePlayer(module) {
        document.getElementById('module-title').textContent = module.title;

        // Load module content based on type
        const contentDiv = document.getElementById('module-content');

        switch (module.content_type) {
            case 'video':
                contentDiv.innerHTML = `
                    <div class="video-container">
                        <video controls width="100%">
                            <source src="${module.content_url}" type="video/mp4">
                            Your browser does not support video playback.
                        </video>
                    </div>
                `;
                break;
            case 'interactive':
                contentDiv.innerHTML = `
                    <div class="interactive-content">
                        <iframe src="${module.content_url}" width="100%" height="400" frameborder="0"></iframe>
                    </div>
                `;
                break;
            default:
                contentDiv.innerHTML = `
                    <div class="text-content">
                        <h3>Learning Content</h3>
                        <p>This module contains important disaster preparedness information.</p>
                        <p>Please review all materials carefully and complete the assessment.</p>
                    </div>
                `;
        }

        document.getElementById('module-modal').style.display = 'block';
    }
}

// Protocol Manager
class ProtocolManager {
    static async loadProtocols() {
        Utils.showLoading('protocols-container');

        try {
            const response = await ApiService.getProtocols();
            this.renderProtocols(response.protocols);
        } catch (error) {
            console.error('Failed to load protocols:', error);
            document.getElementById('protocols-container').innerHTML = `
                <div class="error-message">
                    Failed to load emergency protocols. Please try again later.
                </div>
            `;
        }
    }

    static renderProtocols(protocols) {
        const container = document.getElementById('protocols-container');

        if (!protocols || protocols.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>No protocols available</h3>
                    <p>Emergency protocols will be displayed here when available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = protocols.map((protocol, index) => `
            <div class="protocol-card">
                <div class="protocol-header" onclick="ProtocolManager.toggleProtocol(${index})">
                    <h3>${protocol.title}</h3>
                    <i class="fas fa-chevron-down protocol-toggle" id="toggle-${index}"></i>
                </div>
                <div class="protocol-body" id="protocol-${index}">
                    <div class="protocol-section">
                        <h4><i class="fas fa-list-ol"></i> Emergency Steps</h4>
                        <ol class="protocol-steps">
                            ${protocol.protocol_steps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>

                    ${protocol.evacuation_routes.length > 0 ? `
                        <div class="protocol-section">
                            <h4><i class="fas fa-route"></i> Evacuation Routes</h4>
                            <ul>
                                ${protocol.evacuation_routes.map(route => `<li>${route}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${protocol.assembly_points.length > 0 ? `
                        <div class="protocol-section">
                            <h4><i class="fas fa-map-marker-alt"></i> Assembly Points</h4>
                            <ul>
                                ${protocol.assembly_points.map(point => `<li>${point}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${protocol.emergency_contacts.length > 0 ? `
                        <div class="protocol-section">
                            <h4><i class="fas fa-phone"></i> Emergency Contacts</h4>
                            <ul>
                                ${protocol.emergency_contacts.map(contact => `
                                    <li>
                                        <strong>${contact.name}:</strong> 
                                        <a href="tel:${contact.phone}">${contact.phone}</a>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    static toggleProtocol(index) {
        const body = document.getElementById(`protocol-${index}`);
        const toggle = document.getElementById(`toggle-${index}`);

        body.classList.toggle('active');
        toggle.style.transform = body.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Alert Manager
class AlertManager {
    static async loadAlerts() {
        Utils.showLoading('alerts-container');
        await this.checkForAlerts(true);
    }

    static async checkForAlerts(renderToSection = false) {
        try {
            const response = await ApiService.getAlerts();

            if (response.alerts && response.alerts.length > 0) {
                // Show alert banner if there are critical alerts
                const criticalAlerts = response.alerts.filter(alert => 
                    alert.severity_level === 'critical' || alert.severity_level === 'high'
                );

                if (criticalAlerts.length > 0 && !renderToSection) {
                    this.showAlertBanner(criticalAlerts[0]);
                }
            }

            if (renderToSection) {
                this.renderAlerts(response.alerts);
            }

        } catch (error) {
            console.error('Failed to load alerts:', error);
            if (renderToSection) {
                document.getElementById('alerts-container').innerHTML = `
                    <div class="error-message">
                        Failed to load alerts. Please try again later.
                    </div>
                `;
            }
        }
    }

    static showAlertBanner(alert) {
        const banner = document.getElementById('alert-banner');
        document.getElementById('alert-title').textContent = alert.title;
        document.getElementById('alert-message').textContent = alert.message;
        banner.className = `alert-banner alert-${alert.severity_level}`;
        banner.style.display = 'block';
    }

    static renderAlerts(alerts) {
        const container = document.getElementById('alerts-container');

        if (!alerts || alerts.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>No active alerts</h3>
                    <p>All clear! No emergency alerts at this time.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-card alert-${alert.severity_level}">
                <div class="alert-header">
                    <h3>${alert.title}</h3>
                    <span class="alert-severity">${alert.severity_level.toUpperCase()}</span>
                </div>
                <div class="alert-body">
                    <p>${alert.message}</p>
                    <div class="alert-meta">
                        <span><i class="fas fa-clock"></i> ${Utils.formatDate(alert.created_at)}</span>
                        ${alert.expires_at ? `<span><i class="fas fa-hourglass-end"></i> Expires: ${Utils.formatDate(alert.expires_at)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Progress Manager
class ProgressManager {
    static async loadProgress() {
        Utils.showLoading('progress-details');

        try {
            // Mock progress data for now
            const progressData = {
                overallProgress: 65,
                moduleProgress: [
                    { name: 'Fire Safety', progress: 100, score: 95 },
                    { name: 'Earthquake Response', progress: 80, score: 88 },
                    { name: 'Flood Preparedness', progress: 60, score: null },
                    { name: 'First Aid Basics', progress: 30, score: null }
                ],
                achievements: [
                    { name: 'Fire Safety Expert', date: '2025-09-01', icon: 'fire' },
                    { name: 'Quick Learner', date: '2025-08-28', icon: 'clock' },
                    { name: 'First Module Complete', date: '2025-08-25', icon: 'medal' }
                ]
            };

            this.renderProgress(progressData);

        } catch (error) {
            console.error('Failed to load progress:', error);
            document.getElementById('progress-details').innerHTML = `
                <div class="error-message">
                    Failed to load progress data. Please try again later.
                </div>
            `;
        }
    }

    static renderProgress(data) {
        document.getElementById('progress-details').innerHTML = `
            <div class="progress-sections">
                <div class="progress-section">
                    <h3>Module Progress</h3>
                    <div class="module-progress-list">
                        ${data.moduleProgress.map(module => `
                            <div class="module-progress-item">
                                <div class="module-progress-info">
                                    <h4>${module.name}</h4>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${module.progress}%"></div>
                                    </div>
                                    <div class="progress-stats">
                                        <span>${module.progress}% Complete</span>
                                        ${module.score ? `<span class="score">Score: ${module.score}%</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="progress-section">
                    <h3>Achievements</h3>
                    <div class="achievements-list">
                        ${data.achievements.map(achievement => `
                            <div class="achievement-item">
                                <div class="achievement-icon">
                                    <i class="fas fa-${achievement.icon}"></i>
                                </div>
                                <div class="achievement-info">
                                    <h4>${achievement.name}</h4>
                                    <p>Earned on ${Utils.formatDate(achievement.date)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Assessment Manager
class AssessmentManager {
    static async startAssessment(moduleId) {
        try {
            const response = await ApiService.getAssessment(moduleId);
            this.currentAssessment = response.assessment;
            this.startTimer(response.assessment.time_limit_minutes);
            this.renderAssessment(response.assessment);
            document.getElementById('assessment-modal').style.display = 'block';
        } catch (error) {
            Utils.showError('Failed to load assessment: ' + error.message);
        }
    }

    static renderAssessment(assessment) {
        const content = document.getElementById('assessment-content');
        content.innerHTML = `
            <h3>${assessment.title}</h3>
            <p>Time Limit: ${assessment.time_limit_minutes} minutes</p>
            <p>Attempts Remaining: ${assessment.attempts_remaining}</p>
            <div class="questions-container">
                ${assessment.questions.map((question, index) => `
                    <div class="question-card">
                        <div class="question-title">
                            ${index + 1}. ${question.question}
                        </div>
                        <ul class="question-options">
                            ${question.options.map((option, optIndex) => `
                                <li>
                                    <label>
                                        <input type="radio" name="question-${question.id}" value="${optIndex}">
                                        ${option}
                                    </label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static startTimer(minutes) {
        let timeLeft = minutes * 60; // Convert to seconds

        assessmentTimer = setInterval(() => {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;

            document.getElementById('timer-display').textContent = 
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimer);
                this.submitAssessment(true); // Auto-submit when time runs out
            }

            timeLeft--;
        }, 1000);
    }

    static async submitAssessment(autoSubmit = false) {
        if (assessmentTimer) {
            clearInterval(assessmentTimer);
        }

        // Collect answers
        const answers = [];
        document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            const questionId = input.name.split('-')[1];
            answers.push({
                question_id: questionId,
                selected_option: parseInt(input.value)
            });
        });

        try {
            const response = await ApiService.submitAssessment(this.currentAssessment.id, answers);

            if (autoSubmit) {
                Utils.showSuccess('Assessment auto-submitted due to time limit');
            } else {
                Utils.showSuccess('Assessment submitted successfully!');
            }

            document.getElementById('assessment-modal').style.display = 'none';

            // Refresh progress
            ProgressManager.loadProgress();

        } catch (error) {
            Utils.showError('Failed to submit assessment: ' + error.message);
        }
    }
}

// Global Functions (called from HTML)
function navigateTo(section) {
    App.navigateToSection(section);
}

function closeAlert() {
    document.getElementById('alert-banner').style.display = 'none';
}

function closeModule() {
    document.getElementById('module-modal').style.display = 'none';
    currentModule = null;
}

function showEmergencyProtocols() {
    App.navigateToSection('protocols');
}

function takeAssessment() {
    if (currentModule) {
        AssessmentManager.startAssessment(currentModule.id);
    } else {
        Utils.showError('Please select a module first');
    }
}

function viewProgress() {
    App.navigateToSection('progress');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication
    AuthManager.init();

    // Login form submission
    document.getElementById('login-form').addEventListener('submit', AuthManager.handleLogin);

    // Assessment submission
    document.getElementById('submit-assessment').addEventListener('click', () => {
        AssessmentManager.submitAssessment();
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Filter functionality for modules
    document.getElementById('disaster-filter')?.addEventListener('change', function() {
        ModuleManager.filterModules();
    });

    document.getElementById('level-filter')?.addEventListener('change', function() {
        ModuleManager.filterModules();
    });
});

// Service Worker Registration (for offline functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
