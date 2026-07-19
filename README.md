# E-commerce Platform

A full-stack e-commerce application built with React, Node.js, Express, and MySQL. The project includes a customer-facing storefront, user authentication, and an admin dashboard for managing products, categories, orders, coupons, users, product images, and stock alerts.

## Tech Stack

- Frontend: React, React Router, Axios, Tailwind CSS, React Toastify
- Backend: Node.js, Express, Multer, CORS
- Database: MySQL

## Features

- User registration, login, profile management, and password change
- Product browsing with search, filters, pagination, and autocomplete suggestions
- Product details with multiple images, variants, related products, and reviews-ready UI components
- Cart, wishlist, checkout, and order history pages
- Price alerts and low-stock alerts
- Admin dashboard for users, categories, products, product images, coupons, and orders
- Image upload support for product media

## Project Structure

- backend/ - Express API, MySQL connection, image uploads, and server logic
- frontend/ - React client application
- sample_products.sql - Sample category and product seed data

## Prerequisites

- Node.js 18 or newer
- npm
- MySQL

## Database Setup

1. Create a MySQL database named `ecommerce`.
2. Update the credentials in [backend/db.js](backend/db.js) if your local MySQL setup uses a different host, user, password, or database name.
3. Import the sample data if you want starter products and categories:

```bash
mysql -u root -p ecommerce < sample_products.sql
```

If your MySQL root account has no password, you can omit the `-p` flag.

## Backend Setup

1. Open a terminal in `backend/`.
2. Install dependencies:

```bash
npm install
```

3. Start the API server:

```bash
npm start
```

The backend runs on [http://localhost:8000](http://localhost:8000).

For development with auto-reload:

```bash
npm run dev
```

## Frontend Setup

1. Open a second terminal in `frontend/`.
2. Install dependencies:

```bash
npm install
```

3. Start the React app:

```bash
npm start
```

The frontend runs on [http://localhost:3000](http://localhost:3000).

## Notes

- Uploaded product images are stored in `backend/uploads` and served from `/uploads`.
- The frontend uses the backend API at `http://localhost:8000`.
- If you add your own products manually, make sure the referenced category records already exist.

## Main Routes

- `/login` and `/register` for authentication
- `/shop`, `/product/:id`, `/cart`, `/checkout`, `/wishlist`, `/myorders`, and `/price-alerts` for the customer experience
- `/admin/dashboard`, `/admin/users`, `/admin/categories`, `/admin/products`, `/admin/orders`, `/admin/coupons`, `/admin/product-images`, and `/admin/low-stock` for administration

## Contributing

This is a project workspace README. If you want, I can also add setup notes for deployment, environment variables, or screenshots.