<div align="center">
  <h1 align="center">🚀 DevConnect (Capstone Connect)</h1>
  <p align="center">
    A dynamic platform for developers to connect, share ideas, and showcase their projects.
  </p>
  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react" alt="React" /></a>
  </p>
</div>

<br/>

## ✨ Features

- 🔐 **Secure Authentication:** Seamless Email and OAuth sign-in powered by Supabase.
- 📰 **Dynamic Feed & Profiles:** Share thoughts, engage with other developers, and build your digital identity.
- 🔗 **API Integrations:** Built-in support for LeetCode stats, Gemini AI, and more.
- 🎨 **Modern UI:** Crafted with Tailwind CSS and Radix UI primitives for a beautiful, accessible experience.
- ⚡ **Optimized Performance:** Blazing fast page loads with Next.js App Router.

---

## 🛠️ Prerequisites

Before you begin, ensure you have met the following requirements:
- **[Node.js](https://nodejs.org/)** (v18 or newer)
- **npm**, **yarn**, **pnpm**, or **bun**
- A **[Supabase](https://supabase.com/)** account.

---

## 🚀 Getting Started

Follow these steps to get a local development environment up and running.

### 1. Clone the repository
```bash
git clone https://github.com/architpr/DevConnect.git
cd DevConnect
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add the necessary variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# External APIs
NEXT_PUBLIC_LEETCODE_API_URL=https://myleetcodeapi.onrender.com
NEXT_PUBLIC_BACKEND_URL=your_backend_url

# AI & Scraping
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
SCRAPINGBEE_API_KEY=your_scrapingbee_api_key
SERPAPI_KEY=your_serpapi_key

# GitHub
GITHUB_TOKEN=your_github_token
```

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

---

## 📁 Project Structure

- `src/app`: Contains the Next.js application routes (Authentication, Dashboard, Feed, Networks, and APIs).
- `src/components`: Reusable UI components including Dashboard layout, Providers, and generic UI elements.
- `supabase`: Contains SQL scripts for database migrations and schema updates.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/architpr/DevConnect/issues).
If you want to contribute:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
This project is open-source and free to use.

<div align="center">
  <i>Built with ❤️ by Archit.</i>
</div>
