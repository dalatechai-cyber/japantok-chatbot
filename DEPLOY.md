# Deployment Guide

## Step 1: GitHub

```bash
cd "/Users/bigu/Desktop/japantok chatbot"
git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
git branch -M main
git push -u origin main
```

## Step 2: Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your `japantok-chatbot` repo
5. Click "Deploy"

## Step 3: Environment Variables

In Vercel Dashboard:
1. Settings → Environment Variables
2. Add:
   - Name: `GEMINI_API_KEY`
     Value: Your API key (from https://aistudio.google.com/app/apikeys)
   - Name: `GOOGLE_SHEET_URL`
     Value: https://docs.google.com/spreadsheets/d/e/2PACX-1vTagpr1lvWUi8il5jZcF5CBXDLiocOY_wfB67h_uK7Fu439KmgsLwYCh7uVMdqZHQ/pub?output=csv
3. Click "Save"
4. Go to Deployments → Redeploy latest

## Step 4: Done!

Your chatbot is live at: `https://japantok-chatbot.vercel.app`

## Using the Widget

Add this to any website:
```html
<script
  async
  src="https://japantok-chatbot.vercel.app/widget.js"
  data-japantok-widget
  data-api-origin="https://japantok-chatbot.vercel.app"
></script>
```

The chatbot button will appear in the bottom-right corner.

## Update Your Code

To update after deployment:
```bash
# Make changes locally
git add .
git commit -m "Your message"
git push origin main
# Vercel automatically redeploys!
```
