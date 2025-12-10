#!/bin/bash

# Japan Tok Mongolia Chatbot - Deployment Commands
# Copy and paste these commands into your Terminal

# ============================================
# STEP 1: VERIFY YOUR LOCAL SETUP
# ============================================

# Check Git status
cd "/Users/bigu/Desktop/japantok chatbot"
git status
git log --oneline

# You should see your initial commit here ✓


# ============================================
# STEP 2: CREATE GITHUB REPOSITORY
# ============================================

# DO THIS IN YOUR BROWSER FIRST:
# 1. Go to https://github.com/new
# 2. Create repo named: japantok-chatbot
# 3. Make it PUBLIC
# 4. Copy the HTTPS URL it gives you

# THEN RUN THIS (replace YOUR_USERNAME):
# git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
# git branch -M main
# git push -u origin main


# ============================================
# STEP 3: DEPLOY TO VERCEL
# ============================================

# Option A: Using Vercel CLI (for local testing)
npm install -g vercel
vercel login
vercel # (follow prompts)

# Option B: Via Web Browser (Easier - Recommended)
# 1. Go to https://vercel.com/signup
# 2. Click "Continue with GitHub"
# 3. Authorize Vercel
# 4. Click "New Project"
# 5. Select japantok-chatbot repo
# 6. Click "Deploy" (let it fail, that's normal)


# ============================================
# STEP 4: SET ENVIRONMENT VARIABLES
# ============================================

# In Vercel Dashboard:
# 1. Go to Settings → Environment Variables
# 2. Add GEMINI_API_KEY = [your key from https://aistudio.google.com/app/apikeys]
# 3. Add GOOGLE_SHEET_URL = https://docs.google.com/spreadsheets/d/e/2PACX-1vTagpr1lvWUi8il5jZcF5CBXDLiocOY_wfB67h_uK7Fu439KmgsLwYCh7uVMdqZHQ/pub?output=csv
# 4. Click "Save"


# ============================================
# STEP 5: TRIGGER REDEPLOYMENT
# ============================================

# In Vercel Dashboard:
# 1. Go to Deployments
# 2. Click the three dots on latest deployment
# 3. Select "Redeploy"
# 4. Wait for green checkmark ✓


# ============================================
# STEP 6: TEST YOUR CHATBOT
# ============================================

# Your chatbot is now live at:
# https://japantok-chatbot.vercel.app

# Try asking (in Mongolian):
# - "Prius үнэ хэд вэ?" (What's the price of Prius?)
# - "Land Cruiser НӨАТ-гүй үнэ" (Land Cruiser price without VAT)


# ============================================
# FUTURE: MAKING UPDATES
# ============================================

# To update your chatbot:
# 1. Edit files locally
# 2. Run these commands:

# git add .
# git commit -m "Update: description of changes"
# git push origin main

# Vercel will automatically deploy! 🎉


# ============================================
# TROUBLESHOOTING COMMANDS
# ============================================

# Check if Git is set up correctly
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/japantok-chatbot.git (fetch)
# origin  https://github.com/YOUR_USERNAME/japantok-chatbot.git (push)

# Check your commits
git log --oneline

# View .env (for debugging - DON'T commit this!)
cat .env

# Verify your vercel.json
cat vercel.json

# Check what's in .gitignore
cat .gitignore


# ============================================
# USEFUL VERCEL CLI COMMANDS
# ============================================

# Install Vercel CLI globally
npm install -g vercel

# Log in to Vercel
vercel login

# Deploy from local machine
vercel

# Deploy with environment variables
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env list

# Link to existing Vercel project
vercel link


# ============================================
# NOTES
# ============================================

# - Your .env file is NOT pushed to GitHub (protected by .gitignore)
# - Environment variables on Vercel are separate and secure
# - Every git push automatically triggers a new deployment
# - Vercel gives you a free domain: japantok-chatbot.vercel.app
# - You can add a custom domain later in Vercel Settings
# - Deployments are instant and automatically scaled
