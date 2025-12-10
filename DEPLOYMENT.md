# 🚀 Quick Deployment Guide

## Step-by-Step: Deploy Your Chatbot to Vercel

### ✅ What You've Already Done
- ✓ Built the chatbot application
- ✓ Created backend API endpoints
- ✓ Set up environment variables
- ✓ Initialized Git repository

### 📋 Next Steps (3 minutes)

#### **Step 1: Create a GitHub Account (if you don't have one)**
- Go to https://github.com/signup
- Create your account and verify email

#### **Step 2: Create a GitHub Repository**

**Option A: Using GitHub Web UI (Easiest)**
1. Go to https://github.com/new
2. Repository name: `japantok-chatbot`
3. Description: "Japan Tok Mongolia AI Chatbot"
4. Choose **Public** (free tier requirement)
5. Click "Create repository"
6. Copy the HTTPS URL (looks like: `https://github.com/YOUR_USERNAME/japantok-chatbot.git`)

**Option B: Using Terminal**
```bash
# First, push your local code to GitHub
# Run these commands in your project folder:

git add .
git commit -m "Initial commit: Japan Tok Mongolia Chatbot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
git push -u origin main
```

#### **Step 3: Deploy to Vercel**

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. You'll be redirected to Vercel dashboard
5. Click "New Project"
6. Select your `japantok-chatbot` repository
7. Click "Import"
8. Keep the default settings, click "Deploy"
9. Wait 2-3 minutes for deployment ⏳

#### **Step 4: Add Environment Variables**

1. Your deployment will fail initially (that's normal)
2. In Vercel dashboard, go to **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Paste your actual Google Gemini API key |
| `GOOGLE_SHEET_URL` | `https://docs.google.com/spreadsheets/d/e/2PACX-1vTagpr1lvWUi8il5jZcF5CBXDLiocOY_wfB67h_uK7Fu439KmgsLwYCh7uVMdqZHQ/pub?output=csv` |

4. Click "Save"
5. Go to **Deployments** tab
6. Click the three dots on the latest deployment
7. Select "Redeploy"
8. Wait for deployment to complete ✅

#### **Step 5: Your Chatbot is Live!**

Vercel gives you a URL like: `https://japantok-chatbot.vercel.app`

Share this URL with your team and customers!

---

## 🔑 Where to Get Your Gemini API Key

1. Go to https://aistudio.google.com/app/apikeys
2. Click "Create API Key"
3. Select your Google Cloud project
4. Copy the API key
5. Paste it in Vercel environment variables

---

## ✨ That's It!

Your chatbot is now:
- ✅ Live on the internet
- ✅ Automatically updated when you push to GitHub
- ✅ Scalable and secure
- ✅ Free (up to 100GB bandwidth/month on Vercel free tier)

### Making Updates

To update your chatbot after deployment:
```bash
# Make changes to your files
# Then:
git add .
git commit -m "Update: [describe your changes]"
git push origin main
```

Vercel will automatically redeploy! 🎉

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Google Gemini API: https://ai.google.dev/
- GitHub Help: https://docs.github.com/

Good luck! 🚀
