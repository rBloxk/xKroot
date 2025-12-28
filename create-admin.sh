#!/bin/bash

# Script to create admin user in production
# Replace YOUR_PRODUCTION_URL with your actual Vercel deployment URL
# Example: https://your-app.vercel.app

PRODUCTION_URL="https://your-app.vercel.app"

echo "Creating admin user..."
curl -X POST "${PRODUCTION_URL}/api/admin/init" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "your-secure-password-here"
  }'

echo ""
echo "Done! Now you can login with the credentials you provided."


