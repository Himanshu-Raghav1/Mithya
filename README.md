# Mithya: The Unofficial Community Hub for MIT-WPU

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

Mithya is a playful, Doraemon-themed community application built specifically for MIT students. It serves as a central hub for university life, combining official college resources, live sports slot tracking, and a real-time anonymous forum ("MITVoice").

## 🌟 Key Features

* **MITVoice (Anonymous Forum):** Real-time discussion board with upvotes, downvotes, comments, and post reporting. Powered by a rolling MongoDB collection that ensures only the freshest content (last 50 posts) is displayed.
* **Live Sports Slots:** Integration with a Flask/Playwright background scraper to display real-time availability of college sports facilities.
* **Quick Links & Contacts:** One-tap glassmorphism dashboard connecting students to the Academic Calendar, Event Schedules, Grievance Forms, and direct dials for Deans/Faculty.
* **Concerts & Events:** An interactive timeline of upcoming college events, hackathons, and local Pune concerts (e.g., Amaal Mallik).
* **Playful UI/UX:** Highly optimized Framer Motion animations, a dynamic SVG CSS background (Doraemon style), and a seamless React Single-Page Application (SPA) experience.

---

## 🏗️ Architecture

Mithya utilizes a decoupled, modern web architecture designed for free-tier cloud deployment:

### 1. The Frontend (React/Vite) -> Hosted on **Vercel**
The user interface is a blazing-fast React + TypeScript application packaged with Vite.
* **Styling:** Vanilla CSS combined with Tailwind v4 for complex glassmorphism effects.
* **Animations:** `framer-motion` handles page transitions and the 2-stage "Welcome" modal sequence.
* **Routing:** Client-side React Router.
* **Deployment Magic:** The codebase includes a `vercel.json` file that forcefully instructs Vercel to exclusively build the Vite application and ignore the Python backend files sitting in the same folder.

### 2. The API Server (Flask) -> Hosted on **Render**
A Python Flask server (`app.py`) that acts as the bridge between the React frontend and MongoDB.
* Exposes RESTful endpoints for querying sports slots (`/api/search`) and handling MITVoice interactions (`/api/voice/posts`).

### 3. The Playwright Scraper -> Hosted on **Render** (Background Job)
A dedicated background daemon (`workers.py`) that continuously navigates the official university booking portals via headless Microsoft Playwright.
* It scrapes live slot availability and updates the `mithlaDB` -> `sports_slots` MongoDB collection.
* The API server (`app.py`) concurrently reads from this collection to serve lightning-fast results to the Frontend without triggering rate-limits on the official college servers.

---

## 🚀 Deployment Guide

This repository is uniquely configured to deploy the Frontend and Backend to two completely different cloud providers simultaneously from the exact same branch!

### Frontend (Vercel)
1. Fork/Clone this repository to GitHub.
2. Sign into Vercel and import the repository.
3. Vercel automatically detects the `vercel.json` override file and builds the React app.
4. **Environment Variables:** Add `VITE_API_BASE_URL` with your live Render backend URL (e.g., `https://mithya-api.onrender.com`).

### Backend (Render)
1. Sign into Render.com.
2. Create a new **Native Python Web Service** connected to your repository.
3. Render automatically detects the `render.yaml` configuration file and switches to Native Python instead of Docker.
4. **Environment Variables:** Add your `MONGO_URI` (your MongoDB connection string).
5. Ensure `PYTHON_VERSION` is set strictly to `3.10.13` to bypass Playwright/C++ compilation bugs with newer Python releases.

*(The `start.sh` script automatically launches both the Gunicorn Flask API and the infinite-loop Python Worker simultaneously.)*

---

## 💻 Local Development

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* MongoDB Cluster

### 1. Start the React Frontend
```bash
# Install NPM dependencies
npm install

# Start the Vite development server on port 5173
npm run dev
```

### 2. Start the Python Backend & Scraper
```bash
# Install Python dependencies and Playwright Browsers
pip install -r requirements.txt
playwright install chromium

# Launch the backend using the local batch script
start_backend.bat
```

*Note: Ensure you have manually injected your `MONGO_URI` connection string into `workers.py` during local development since secrets are specifically `.gitignore`'d.*
