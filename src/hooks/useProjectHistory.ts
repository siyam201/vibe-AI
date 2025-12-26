import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FileItem } from '@/components/files/FileExplorer';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  files: FileItem[];
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

// Re-export FileItem for backwards compatibility
export type { FileItem };

// Legacy type alias for backwards compatibility
export type ProjectHistoryItem = Project;

// Default files for new projects
export const getDefaultFiles = (): FileItem[] => [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'login-html',
        name: 'login.html',
        type: 'file',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
      </div>
      
      <form id="login-form" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required />
        </div>
        
        <button type="submit" class="btn btn-primary" id="login-btn">
          <span>Sign In</span>
        </button>
      </form>
      
      <div id="message" class="message"></div>
      
      <div class="auth-footer">
        <p>Don't have an account? <a href="signup.html">Sign Up</a></p>
        <p><a href="index.html">← Back to Home</a></p>
      </div>
    </div>
  </div>
  <script type="module" src="login.js"></script>
</body>
</html>`,
      },
      {
        id: 'signup-html',
        name: 'signup.html',
        type: 'file',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign Up - My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Create Account</h1>
        <p>Sign up for a new account</p>
      </div>
      
      <form id="signup-form" class="auth-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" name="name" placeholder="Enter your name" required />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Create a password (min 6 chars)" required minlength="6" />
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input type="password" id="confirm-password" name="confirm-password" placeholder="Confirm your password" required />
        </div>
        
        <button type="submit" class="btn btn-primary" id="signup-btn">
          <span>Create Account</span>
        </button>
      </form>
      
      <div id="message" class="message"></div>
      
      <div class="auth-footer">
        <p>Already have an account? <a href="login.html">Sign In</a></p>
        <p><a href="index.html">← Back to Home</a></p>
      </div>
    </div>
  </div>
  <script type="module" src="signup.js"></script>
</body>
</html>`,
      },
      {
        id: 'dashboard-html',
        name: 'dashboard.html',
        type: 'file',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="dashboard-container">
    <nav class="dashboard-nav">
      <div class="nav-brand">
        <h2>My App</h2>
      </div>
      <div class="nav-user">
        <span id="user-email">Loading...</span>
        <button id="logout-btn" class="btn btn-secondary">Logout</button>
      </div>
    </nav>
    
    <main class="dashboard-main">
      <div class="dashboard-header">
        <h1>Welcome to Dashboard</h1>
        <p id="welcome-text">Hello, User!</p>
      </div>
      
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="card-icon">📊</div>
          <h3>Analytics</h3>
          <p>View your app statistics</p>
          <span class="card-value">1,234</span>
        </div>
        
        <div class="dashboard-card">
          <div class="card-icon">👥</div>
          <h3>Users</h3>
          <p>Manage user accounts</p>
          <span class="card-value">56</span>
        </div>
        
        <div class="dashboard-card">
          <div class="card-icon">📝</div>
          <h3>Projects</h3>
          <p>Your active projects</p>
          <span class="card-value">12</span>
        </div>
        
        <div class="dashboard-card">
          <div class="card-icon">⚡</div>
          <h3>Performance</h3>
          <p>System performance metrics</p>
          <span class="card-value">98%</span>
        </div>
      </div>
      
      <div class="session-info">
        <h3>Session Info</h3>
        <pre id="session-info">Loading session data...</pre>
      </div>
      
      <div id="realtime-message" class="realtime-message"></div>
    </main>
  </div>
  <script type="module" src="dashboard.js"></script>
</body>
</html>`,
      },
      {
        id: 'index-html',
        name: 'index.html',
        type: 'file',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App - Welcome</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="landing-container">
    <nav class="landing-nav">
      <div class="nav-brand">
        <h2>My App</h2>
      </div>
      <div class="nav-links">
        <a href="login.html" class="btn btn-secondary">Login</a>
        <a href="signup.html" class="btn btn-primary">Sign Up</a>
      </div>
    </nav>
    
    <main class="landing-hero">
      <div class="hero-content">
        <h1>Build Amazing Apps</h1>
        <p>A complete authentication template with Supabase integration. Login, Signup, Dashboard - all ready to go!</p>
        <div class="hero-buttons">
          <a href="signup.html" class="btn btn-primary btn-lg">Get Started</a>
          <a href="login.html" class="btn btn-secondary btn-lg">Sign In</a>
        </div>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <span class="feature-icon">🔐</span>
          <h3>Secure Auth</h3>
          <p>Email/password authentication with Supabase</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">✉️</span>
          <h3>Email Verification</h3>
          <p>Built-in email confirmation flow</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🎨</span>
          <h3>Modern Design</h3>
          <p>Beautiful UI with dark mode support</p>
        </div>
      </div>
    </main>
  </div>
  <script type="module" src="main.js"></script>
</body>
</html>`,
      },
      {
        id: 'utils-js',
        name: 'utils.js',
        type: 'file',
        extension: 'js',
        content: `// Supabase Configuration
// Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client (using CDN)
let supabase = null;

// Load Supabase from CDN
async function initSupabase() {
  if (supabase) return supabase;
  
  // Check if already loaded
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  }
  
  // For demo purposes, return mock client
  console.log('Supabase not configured. Using demo mode.');
  return createMockClient();
}

// Mock client for demo purposes
function createMockClient() {
  const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
  const currentSession = JSON.parse(localStorage.getItem('mock_session') || 'null');
  
  return {
    auth: {
      signUp: async ({ email, password, options }) => {
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
          return { data: null, error: { message: 'User already registered' } };
        }
        const newUser = { 
          id: crypto.randomUUID(), 
          email, 
          password,
          user_metadata: options?.data || {},
          created_at: new Date().toISOString()
        };
        mockUsers.push(newUser);
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));
        return { 
          data: { user: newUser, session: null }, 
          error: null 
        };
      },
      signInWithPassword: async ({ email, password }) => {
        const user = mockUsers.find(u => u.email === email && u.password === password);
        if (!user) {
          return { data: null, error: { message: 'Invalid login credentials' } };
        }
        const session = { user, access_token: 'mock_token_' + Date.now() };
        localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('mock_session');
        return { error: null };
      },
      getSession: async () => {
        const session = JSON.parse(localStorage.getItem('mock_session') || 'null');
        return { data: { session }, error: null };
      },
      onAuthStateChange: (callback) => {
        // Initial call
        const session = JSON.parse(localStorage.getItem('mock_session') || 'null');
        callback('INITIAL_SESSION', session);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  };
}

// Export for use in other modules
export { initSupabase, SUPABASE_URL, SUPABASE_ANON_KEY };

// Helper: Show message
export function showMessage(elementId, text, type = 'info') {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text;
    el.className = 'message message-' + type;
    el.style.display = 'block';
  }
}

// Helper: Redirect to login if no session
export async function redirectToLoginIfNoSession() {
  const client = await initSupabase();
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
  return session;
}

// Helper: Redirect to dashboard if has session
export async function redirectToDashboardIfSession() {
  const client = await initSupabase();
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
  return session;
}`,
      },
      {
        id: 'login-js',
        name: 'login.js',
        type: 'file',
        extension: 'js',
        content: `import { initSupabase, showMessage, redirectToDashboardIfSession } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const supabase = await initSupabase();
  
  // Redirect if already logged in
  await redirectToDashboardIfSession();
  
  const form = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showMessage('message', 'Please fill in all fields', 'error');
      return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span>';
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        showMessage('message', error.message, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span>';
        return;
      }
      
      showMessage('message', 'Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
      
    } catch (err) {
      showMessage('message', 'An error occurred. Please try again.', 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>Sign In</span>';
    }
  });
});`,
      },
      {
        id: 'signup-js',
        name: 'signup.js',
        type: 'file',
        extension: 'js',
        content: `import { initSupabase, showMessage, redirectToDashboardIfSession } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const supabase = await initSupabase();
  
  // Redirect if already logged in
  await redirectToDashboardIfSession();
  
  const form = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!name || !email || !password || !confirmPassword) {
      showMessage('message', 'Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage('message', 'Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('message', 'Password must be at least 6 characters', 'error');
      return;
    }
    
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<span>Creating account...</span>';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          },
          emailRedirectTo: window.location.origin + '/dashboard.html'
        }
      });
      
      if (error) {
        showMessage('message', error.message, 'error');
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<span>Create Account</span>';
        return;
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        showMessage('message', 'Account created! Please check your email to verify your account.', 'success');
      } else if (data.session) {
        showMessage('message', 'Account created! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      }
      
      signupBtn.disabled = false;
      signupBtn.innerHTML = '<span>Create Account</span>';
      
    } catch (err) {
      showMessage('message', 'An error occurred. Please try again.', 'error');
      signupBtn.disabled = false;
      signupBtn.innerHTML = '<span>Create Account</span>';
    }
  });
});`,
      },
      {
        id: 'dashboard-js',
        name: 'dashboard.js',
        type: 'file',
        extension: 'js',
        content: `import { initSupabase, showMessage, redirectToLoginIfNoSession } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const supabase = await initSupabase();
  
  const userEmailElement = document.getElementById('user-email');
  const sessionInfoElement = document.getElementById('session-info');
  const logoutButton = document.getElementById('logout-button');
  const realtimeMessage = document.getElementById('realtime-message');
  const welcomeText = document.getElementById('welcome-text');
  
  // Redirect to login if no session
  const session = await redirectToLoginIfNoSession();
  if (!session) return;
  
  // Get current session
  const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error getting session:', sessionError);
    showMessage('realtime-message', 'Error fetching session data. Please try logging in again.', 'error');
    await redirectToLoginIfNoSession();
    return;
  }
  
  if (currentSession && currentSession.user) {
    const user = currentSession.user;
    
    // Display user email
    if (userEmailElement) {
      userEmailElement.textContent = user.email;
    }
    
    // Display welcome message
    if (welcomeText) {
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      welcomeText.textContent = 'Hello, ' + displayName + '!';
    }
    
    // Display session info (sanitized)
    if (sessionInfoElement) {
      const safeSession = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          user_metadata: user.user_metadata
        },
        expires_at: currentSession.expires_at
      };
      sessionInfoElement.textContent = JSON.stringify(safeSession, null, 2);
    }
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Logging out...';
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showMessage('realtime-message', 'Error signing out: ' + error.message, 'error');
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Logout';
        return;
      }
      
      window.location.href = 'login.html';
    } catch (err) {
      showMessage('realtime-message', 'An error occurred. Please try again.', 'error');
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Logout';
    }
  });
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    }
  });
});`,
      },
      {
        id: 'main-js',
        name: 'main.js',
        type: 'file',
        extension: 'js',
        content: `import { initSupabase } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const supabase = await initSupabase();
  
  // Check if user is already logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Update nav to show dashboard link
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.innerHTML = '<a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>';
    }
  }
  
  console.log('App initialized!');
});`,
      },
      {
        id: 'styles-css',
        name: 'styles.css',
        type: 'file',
        extension: 'css',
        content: `:root {
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --secondary: #1e1b4b;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --bg-dark: #0f0a1a;
  --bg-card: rgba(30, 27, 75, 0.6);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border: rgba(99, 102, 241, 0.2);
  color-scheme: dark;
}

* { 
  margin: 0; 
  padding: 0; 
  box-sizing: border-box; 
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg-dark);
  background-image: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(139, 92, 246, 0.1), transparent);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.6;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--primary);
}

.btn-lg {
  padding: 16px 32px;
  font-size: 16px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Auth Container */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.auth-header p {
  color: var(--text-secondary);
}

/* Form Styles */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  padding: 14px 16px;
  background: rgba(15, 10, 26, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

/* Message */
.message {
  display: none;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
}

.message-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--success);
}

.message-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--error);
}

.message-info {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: var(--primary);
}

/* Auth Footer */
.auth-footer {
  margin-top: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-footer a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.auth-footer p + p {
  margin-top: 12px;
}

/* Landing Page */
.landing-container {
  min-height: 100vh;
}

.landing-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  border-bottom: 1px solid var(--border);
}

.nav-brand h2 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 12px;
}

.landing-hero {
  padding: 80px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  text-align: center;
  margin-bottom: 60px;
}

.hero-content h1 {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-content p {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto 32px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.feature-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Dashboard */
.dashboard-container {
  min-height: 100vh;
}

.dashboard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-user span {
  color: var(--text-secondary);
  font-size: 14px;
}

.dashboard-main {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 40px;
}

.dashboard-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.dashboard-header p {
  color: var(--text-secondary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.dashboard-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.dashboard-card h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.dashboard-card p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
}

.session-info {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.session-info h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.session-info pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.realtime-message {
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .landing-nav {
    padding: 16px 20px;
  }
  
  .landing-hero {
    padding: 40px 20px;
  }
  
  .hero-content h1 {
    font-size: 36px;
  }
  
  .auth-card {
    padding: 24px;
  }
  
  .dashboard-main {
    padding: 20px;
  }
}`,
      },
    ],
  },
  {
    id: 'readme',
    name: 'README.md',
    type: 'file',
    extension: 'md',
    content: `# My App - Auth Template

A complete authentication template with Login, Signup, and Dashboard pages.

## Features

- 🔐 **Secure Authentication** - Email/password login with Supabase
- ✉️ **Email Verification** - Built-in email confirmation flow
- 🎨 **Modern Design** - Beautiful dark mode UI
- 📱 **Responsive** - Works on all devices

## Pages

- \`index.html\` - Landing page with hero section
- \`login.html\` - User login form
- \`signup.html\` - User registration form
- \`dashboard.html\` - Protected dashboard page

## Setup with Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Update \`utils.js\` with your credentials:

\`\`\`javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
\`\`\`

4. (Optional) Disable "Confirm email" in Authentication > Providers for faster testing

## Demo Mode

Without Supabase configuration, the app runs in demo mode with localStorage-based authentication.

## Ask AI

Try asking:
- "Add password reset functionality"
- "Add social login with Google"
- "Create a user profile page"
- "Add dark/light theme toggle"`,
  },
];

export const useProjectHistory = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      setIsLoaded(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        return;
      }

      const projectsList = (data || []).map((p) => ({
        ...p,
        files: (p.files as unknown as FileItem[]) || [],
      })) as Project[];

      setProjects(projectsList);

      // Set current project to most recently updated if none selected
      if (projectsList.length > 0 && !currentProject) {
        setCurrentProject(projectsList[0]);
      } else if (projectsList.length === 0) {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Error in fetchProjects:', err);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create a new project
  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    if (!user?.id) {
      toast.error('Please log in to create projects');
      return null;
    }

    const sanitizedName = name.trim().slice(0, 48) || 'My-App';

    try {
      const insertData = {
        user_id: user.id,
        name: sanitizedName,
        description: description || null,
        files: JSON.parse(JSON.stringify(getDefaultFiles())),
        is_starred: false,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
        return null;
      }

      const project = {
        ...data,
        files: data.files as unknown as FileItem[],
      } as Project;

      setProjects((prev) => [project, ...prev]);
      setCurrentProject(project);
      toast.success(`Created "${sanitizedName}"`);
      return project;
    } catch (err) {
      console.error('Error in createProject:', err);
      return null;
    }
  };

  // Update project files (with debounce-friendly design)
  const updateProjectFiles = useCallback(
    async (projectId: string, files: FileItem[]) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from('projects')
          .update({ files: JSON.parse(JSON.stringify(files)) })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating project files:', error);
          return;
        }

        // Update local state
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, files, updated_at: new Date().toISOString() } : p
          )
        );

        if (currentProject?.id === projectId) {
          setCurrentProject((prev) =>
            prev ? { ...prev, files, updated_at: new Date().toISOString() } : prev
          );
        }
      } catch (err) {
        console.error('Error in updateProjectFiles:', err);
      }
    },
    [user?.id, currentProject?.id]
  );

  // Rename project
  const renameProject = async (projectId: string, newName: string) => {
    if (!user?.id) return;

    const sanitizedName = newName.trim().slice(0, 48) || 'My-App';

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: sanitizedName })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming project:', error);
        toast.error('Failed to rename project');
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: sanitizedName } : p))
      );

      if (currentProject?.id === projectId) {
        setCurrentProject((prev) => (prev ? { ...prev, name: sanitizedName } : prev));
      }
    } catch (err) {
      console.error('Error in renameProject:', err);
    }
  };

  // Load a specific project
  const loadProject = (projectId: string): Project | null => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      return project;
    }
    return null;
  };

  // Delete a project
  const deleteProject = async (projectId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
        return;
      }

      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);

      if (currentProject?.id === projectId) {
        setCurrentProject(remaining[0] || null);
      }

      toast.success('Project deleted');
    } catch (err) {
      console.error('Error in deleteProject:', err);
    }
  };

  // Duplicate a project
  const duplicateProject = async (projectId: string): Promise<Project | null> => {
    const source = projects.find((p) => p.id === projectId);
    if (!source || !user?.id) return null;

    const result = await createProject(`${source.name} (Copy)`, source.description || undefined);
    return result;
  };

  // Toggle star status
  const toggleStar = async (projectId: string) => {
    if (!user?.id) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_starred: !project.is_starred })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling star:', error);
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, is_starred: !p.is_starred } : p))
      );
    } catch (err) {
      console.error('Error in toggleStar:', err);
    }
  };

  return {
    projects,
    currentProject,
    loading,
    isLoaded,
    createProject,
    updateProjectFiles,
    renameProject,
    loadProject,
    deleteProject,
    duplicateProject,
    toggleStar,
    refetch: fetchProjects,
  };
};
