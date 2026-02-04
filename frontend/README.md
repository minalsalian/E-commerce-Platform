# E-commerce Platform (React + Node + MySQL)

A full-stack e-comme rce web app built with React, Node.js, Express, and MySQL. It includes an admin dashboard, product management, image uploads, pagination, wishlist, cart, orders, and user authentication.

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL

## Features
- Admin dashboard for products, categories, users, and orders
- Product images with multi-image support
- Pagination and search
- Wishlist and cart
- Flash deals and related products
- User authentication and profiles

## Project Structure
- backend/ — Express API, MySQL connection, image uploads
- frontend/ — React app

## Prerequisites
- Node.js (18+ recommended)
- MySQL

## Setup

### 1) Backend
1. Create a MySQL database and update your connection details in backend/db.js.
2. Install dependencies:
	- npm install
3. Start the API server:
	- npm start

The API runs at http://localhost:8000

### 2) Frontend
1. Install dependencies:
	- npm install
2. Start the client:
	- npm start

The app runs at http://localhost:3000

## Notes
- Uploaded images are stored in backend/uploads and served from /uploads.
- Placeholder image is at frontend/public/images/placeholder.svg.


