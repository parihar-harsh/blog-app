# Blog Application

A full-stack blogging platform built with modern web technologies. This application features user authentication, blog creation, and a clean, responsive UI.

## 🚀 Features

- **User Authentication**: Secure signup and signin functionality with JWT tokens
- **Blog Management**: Create, read, and publish blog posts
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Type Safety**: Full TypeScript support across frontend and backend
- **Serverless Backend**: Powered by Cloudflare Workers for optimal performance
- **Shared Validation**: Common validation schemas using Zod

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API requests

### Backend
- **Cloudflare Workers** (serverless runtime)
- **Hono** - lightweight web framework
- **Prisma** with Accelerate for database management
- **PostgreSQL** database
- **JWT** for authentication

### Shared
- **Zod** for runtime type validation
- **TypeScript** for type safety

## 📁 Project Structure

```
.
├── backend/              
│   ├── src/
│   │   ├── index.ts    
│   │   └── routes/     
│   ├── prisma/         
│   └── wrangler.toml    
│
├── frontend/           
│   ├── src/
│   │   ├── components/  
│   │   ├── pages/       
│   │   ├── hooks/      
│   │   └── config.ts    
│   └── public/
│
└── common/             
    └── src/
        └── index.ts    
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/parihar-harsh/blog-app.git
   cd blog-app
   ```

2. **Install dependencies for all packages**

   ```bash
   
   cd backend
   npm install

 
   cd ../frontend
   npm install


   cd ../common
   npm install
   ```

3. **Set up the database**

   ```bash
   cd backend
   npx prisma migrate dev
   ```

4. **Configure environment variables**

   Backend (`backend/wrangler.toml` or `.dev.vars`):
   ```toml
   DATABASE_URL="your_postgres_connection_string"
   JWT_SECRET="your_jwt_secret"
   ```

   Frontend (`frontend/src/config.ts`):
   ```typescript
   export const BACKEND_URL = "your_backend_url"
   ```

### Development

1. **Run the backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8787`

## 📦 Building and Deployment

### Backend Deployment (Cloudflare Workers)

```bash
cd backend
npm run deploy
```

### Frontend Deployment (Vercel/Netlify)

```bash
cd frontend
npm run build
```

## 🔑 API Endpoints

### User Routes
- `POST /api/v1/user/signup` - Create a new user account
- `POST /api/v1/user/signin` - Sign in to an existing account

### Blog Routes
- `GET /api/v1/blog/bulk` - Get all blog posts
- `GET /api/v1/blog/:id` - Get a specific blog post
- `POST /api/v1/blog` - Create a new blog post (authenticated)
- `PUT /api/v1/blog` - Update a blog post (authenticated)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. After successful signup/signin, the token is stored in localStorage and included in subsequent API requests.

## 📝 Database Schema

### User Model
```prisma
model User {
  id       Int      @id @default(autoincrement())
  name     String?
  username String   @unique
  password String
  blogs    Blog[]
}
```

### Blog Model
```prisma
model Blog {
  id        Int      @id @default(autoincrement())
  authorId  Int
  content   String
  title     String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
}
```

## 🎨 UI Components

- **Auth Component**: Reusable authentication form
- **BlogCard**: Preview card for blog posts
- **FullBlog**: Full blog post display
- **Appbar**: Navigation bar with user avatar
- **Quote**: Decorative quote component
- **Spinner & Skeleton**: Loading states

## 🧪 Type Safety

The project uses a shared `common` package with Zod schemas for runtime validation:

- `SignupInput` - User signup validation
- `SigninInput` - User signin validation
- `CreateBlogInput` - Blog creation validation
- `UpdateBlogInput` - Blog update validation

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**Harsh Parihar**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if you like this project!

## 📧 Contact

For questions or support, please open an issue in the repository.


