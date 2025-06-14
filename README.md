# Princess Hotels Price List Management System

A full-stack web application for managing and displaying price lists for Princess Hotels' various outlets.

## Features

- Display price lists for multiple outlets
- Admin interface for managing items
- Real-time updates
- Responsive design
- Image upload functionality
- User authentication

## Outlets

1. Restaurant
2. Pool Bar and Garden Bar
3. Lounge
4. Klubb Spartacuz
5. Grill Kitchen
6. Coco Kitchen

## Tech Stack

- Frontend: React.js
- Backend: Node.js/Express
- Database: MongoDB
- Authentication: JWT
- File Upload: Multer

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```

3. Create a .env file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev:full
   ```

## Admin Access

To create an admin account, you'll need to:
1. Register a new user
2. Update the user's isAdmin field to true in the database

## License

MIT 