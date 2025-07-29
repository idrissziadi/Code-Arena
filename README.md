# 🧠 CodeArena

**CodeArena** is an advanced web platform for competitive programming, allowing developers to practice coding problems grouped by data structures, track performance, and compete in live challenges.

Inspired by platforms like **LeetCode** and **GeeksforGeeks**, it is ideal for learners, students, and developers preparing for interviews or programming contests.

---

## 🚀 Features

- ✅ Practice problems by data structure and difficulty  
- 💡 See example inputs, test cases, and problem tags  
- 🧪 Submit code and get real-time verdicts via Piston  
- 📊 Track personal statistics (per problem & structure)  
- 🎯 Earn badges for milestones  
- 🧠 View & propose solutions (after solving)  
- ❤️ Favorite problems  
- 🗣️ Comment and discuss problems  
- 🏆 Participate in coding contests  
- 🛠️ Admin dashboard to manage content

---

## ⚙️ Tech Stack

### 🔧 Backend
- **Supabase** (PostgreSQL database, Auth, Storage)
- **Piston API** for code execution
- **JWT** for secure authentication
- **Bcrypt.js** for password hashing

### 🎨 Frontend
- **React** with **Vite**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (headless, accessible components)

---

## 🐳 Quick Start with Docker

The fastest way to get CodeArena running:

```bash
# Clone the repository
git clone https://github.com/idrissziadi/Code-Arena/
cd codearena

# Build and run with Docker
docker build -t codearena .
docker run -p 3000:3000 codearena
```

Visit `http://localhost:3000` to access the application.

---

## 🛠️ Local Development Setup

> Make sure you have [Node.js](https://nodejs.org) installed.

```bash
# Clone the repository
git clone https://github.com/idrissziadi/Code-Arena/
cd codearena

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

---

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Docker
docker build -t codearena .     # Build Docker image
docker run -p 3000:3000 codearena  # Run container
```

---

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development settings
NODE_ENV=development
```

---

## 🏗️ Project Structure

```
codearena/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── integrations/  # External service integrations
├── public/            # Static assets
├── supabase/          # Supabase configuration
├── Dockerfile         # Docker configuration
└── .dockerignore      # Docker ignore rules
```

---

## 🐳 Docker Commands

### Build and Run
```bash
# Build the image
docker build -t codearena .

# Run the container
docker run -p 3000:3000 codearena

# Run in background
docker run -d -p 3000:3000 --name codearena-app codearena
```

### Development with Docker
```bash
# Build for development
docker build -t codearena:dev .

# Run with volume mounting for hot reload
docker run -p 8080:8080 -v $(pwd):/app -v /app/node_modules codearena:dev
```

### Container Management
```bash
# Stop container
docker stop codearena-app

# Remove container
docker rm codearena-app

# View logs
docker logs codearena-app

# Execute commands in container
docker exec -it codearena-app sh
```

---

## 🚀 Deployment

### Docker Deployment
```bash
# Build production image
docker build -t codearena:latest .

# Deploy to server
docker run -d -p 80:3000 --name codearena-prod codearena:latest
```

### Environment Variables for Production
Make sure to set the following environment variables in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Piston](https://piston.readthedocs.io/) for code execution
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Vite](https://vitejs.dev/) for the build tool

---

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.
