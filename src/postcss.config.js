export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

4. **Click:** "Commit new file"

---

### **FILE 9: `.gitignore`**

Tells Git what files to ignore.

**What to do:**
1. Click **"Add file"** → **"Create new file"**
2. Name it: `.gitignore` (yes, starts with a dot)
3. **Copy and paste this exactly:**
```
# Dependencies
node_modules

# Build output
dist
.vercel

# Environment variables
.env
.env.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db
