#!/bin/bash

echo "🚀 FLUI - Starting All Services"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check/Start Backend
echo "📡 Checking Backend API..."
if curl -s http://localhost:3001/api/automations > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend already running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting backend...${NC}"
    cd /workspace
    npm run start:api > /tmp/backend.log 2>&1 &
    sleep 5
    
    if curl -s http://localhost:3001/api/automations > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start backend${NC}"
        exit 1
    fi
fi

# 2. Check/Start Frontend
echo ""
echo "🎨 Checking Frontend..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend already running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting frontend...${NC}"
    cd /workspace/flui-frontend-vite
    npm run dev > /tmp/frontend.log 2>&1 &
    sleep 8
    
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend${NC}"
        echo "Check logs: tail -f /tmp/frontend.log"
        exit 1
    fi
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ ALL SERVICES RUNNING!${NC}"
echo "================================"
echo ""
echo "🌐 Frontend: http://localhost:8080"
echo "📡 Backend:  http://localhost:3001"
echo ""
echo "📝 Next Steps:"
echo "1. Open browser: http://localhost:8080"
echo "2. Follow test guide: /workspace/TEST_ALL_FEATURES.md"
echo ""
echo "🧹 To stop services:"
echo "   pkill -f 'vite|node dist/startApi'"
echo ""
