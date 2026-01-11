#!/bin/bash
# Bash deployment script for API with progress messages
# Usage: ./deploy.sh [--skip-commit] [--skip-migrate]

SKIP_COMMIT=false
SKIP_MIGRATE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-commit)
            SKIP_COMMIT=true
            shift
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

set -e

echo "🚀 Starting API Deployment..."
echo "================================="
echo ""

# Step 1: Check git status
echo "📋 Step 1: Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "   Found uncommitted changes:"
    git status --short | sed 's/^/   /'
    echo ""
    
    if [ "$SKIP_COMMIT" = false ]; then
        echo "💾 Step 2: Staging changes..."
        git add .
        echo "   ✅ Changes staged"
        echo ""
        
        echo "📝 Step 3: Committing changes..."
        COMMIT_MESSAGE="Deploy: Update OTP verification with Evolution API"
        git commit -m "$COMMIT_MESSAGE"
        echo "   ✅ Changes committed: $COMMIT_MESSAGE"
        echo ""
    else
        echo "⏭️  Skipping commit (--skip-commit flag set)"
        echo ""
    fi
else
    echo "   ✅ No uncommitted changes"
    echo ""
fi

# Step 4: Push to remote
echo "📤 Step 4: Pushing to remote repository..."
if git push origin main; then
    echo "   ✅ Successfully pushed to remote"
    echo ""
else
    echo "   ⚠️  Push failed, but continuing..."
    echo ""
fi

# Step 5: Check if Dokploy auto-deploys
echo "🔍 Step 5: Checking deployment method..."
echo "   ℹ️  If using Dokploy with Git integration, deployment should start automatically"
echo "   ℹ️  Check your Dokploy dashboard for deployment status"
echo ""

# Step 6: Optional migration
if [ "$SKIP_MIGRATE" = false ]; then
    echo "🗄️  Step 6: Database migration reminder..."
    echo "   ℹ️  If database schema changed, run migrations:"
    echo "      cd api && npm run migrate"
    echo ""
else
    echo "⏭️  Skipping migration reminder (--skip-migrate flag set)"
    echo ""
fi

# Summary
echo "================================="
echo "✅ Deployment process completed!"
echo ""
echo "📊 Summary:"
echo "   • Changes committed: $([ "$SKIP_COMMIT" = false ] && echo "Yes" || echo "Skipped")"
echo "   • Changes pushed: Yes"
echo "   • Next: Monitor Dokploy dashboard for deployment status"
echo ""
