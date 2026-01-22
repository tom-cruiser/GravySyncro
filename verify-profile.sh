#!/bin/bash

# Profile Feature Verification Script
echo "========================================="
echo "Profile Feature Implementation Check"
echo "========================================="
echo ""

# Check if .env file exists
echo "✓ Checking frontend .env configuration..."
if [ -f ".env" ]; then
    echo "  ✅ Frontend .env file exists"
    grep -q "VITE_API_URL" .env && echo "  ✅ VITE_API_URL configured" || echo "  ⚠️  VITE_API_URL missing"
else
    echo "  ❌ Frontend .env file missing"
fi
echo ""

# Check if backend .env file exists
echo "✓ Checking backend .env configuration..."
if [ -f "backend/.env" ]; then
    echo "  ✅ Backend .env file exists"
    grep -q "JWT_SECRET" backend/.env && echo "  ✅ JWT_SECRET configured" || echo "  ⚠️  JWT_SECRET missing"
    grep -q "MONGODB_URI" backend/.env && echo "  ✅ MONGODB_URI configured" || echo "  ⚠️  MONGODB_URI missing"
else
    echo "  ❌ Backend .env file missing"
fi
echo ""

# Check Profile.jsx exists
echo "✓ Checking Profile component..."
if [ -f "src/pages/Profile.jsx" ]; then
    echo "  ✅ Profile.jsx exists"
    grep -q "handleProfileUpdate" src/pages/Profile.jsx && echo "  ✅ Profile update function implemented" || echo "  ❌ Profile update missing"
    grep -q "handlePasswordUpdate" src/pages/Profile.jsx && echo "  ✅ Password update function implemented" || echo "  ❌ Password update missing"
    grep -q "axios.patch" src/pages/Profile.jsx && echo "  ✅ API integration present" || echo "  ❌ API integration missing"
else
    echo "  ❌ Profile.jsx not found"
fi
echo ""

# Check Profile.css exists
echo "✓ Checking Profile styles..."
if [ -f "src/pages/Profile.css" ]; then
    echo "  ✅ Profile.css exists"
    grep -q "user-info-box" src/pages/Profile.css && echo "  ✅ Enhanced styling present" || echo "  ⚠️  Enhanced styling missing"
else
    echo "  ❌ Profile.css not found"
fi
echo ""

# Check backend controller
echo "✓ Checking backend controllers..."
if [ -f "backend/src/controllers/userController.js" ]; then
    echo "  ✅ userController.js exists"
    grep -q "updateProfile" backend/src/controllers/userController.js && echo "  ✅ updateProfile function present" || echo "  ❌ updateProfile missing"
else
    echo "  ❌ userController.js not found"
fi

if [ -f "backend/src/controllers/authController.js" ]; then
    echo "  ✅ authController.js exists"
    grep -q "changePassword" backend/src/controllers/authController.js && echo "  ✅ changePassword function present" || echo "  ❌ changePassword missing"
else
    echo "  ❌ authController.js not found"
fi
echo ""

# Check routes
echo "✓ Checking API routes..."
if [ -f "backend/src/routes/user.routes.js" ]; then
    echo "  ✅ user.routes.js exists"
    grep -q "/profile" backend/src/routes/user.routes.js && echo "  ✅ Profile route configured" || echo "  ❌ Profile route missing"
else
    echo "  ❌ user.routes.js not found"
fi

if [ -f "backend/src/routes/auth.routes.js" ]; then
    echo "  ✅ auth.routes.js exists"
    grep -q "change-password" backend/src/routes/auth.routes.js && echo "  ✅ Change password route configured" || echo "  ❌ Change password route missing"
else
    echo "  ❌ auth.routes.js not found"
fi
echo ""

# Check validator
echo "✓ Checking validation middleware..."
if [ -f "backend/src/middleware/validator.js" ]; then
    echo "  ✅ validator.js exists"
    grep -q "updateProfile" backend/src/middleware/validator.js && echo "  ✅ Profile validation schema present" || echo "  ❌ Profile validation missing"
    grep -q "changePassword" backend/src/middleware/validator.js && echo "  ✅ Password validation schema present" || echo "  ❌ Password validation missing"
else
    echo "  ❌ validator.js not found"
fi
echo ""

echo "========================================="
echo "Verification Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Start backend:   cd backend && npm run dev"
echo "2. Start frontend:  npm run dev"
echo "3. Test profile updates and password changes"
echo ""
echo "For detailed implementation info, see:"
echo "  📄 PROFILE_IMPLEMENTATION.md"
echo ""
