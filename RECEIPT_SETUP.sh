#!/bin/bash
# Quick Setup Script for Receipt Feature
# Run this to get started with the receipt system

echo "🚀 GOCRM Receipt System - Setup Guide"
echo "=====================================\n"

echo "📋 Step 1: Database Setup"
echo "------------------------"
echo "1. Go to Supabase Dashboard (https://app.supabase.com)"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Click 'New query'"
echo "5. Copy-paste contents from: lib/db-schema.sql"
echo "6. Click 'Run' to execute"
echo ""
echo "✅ Tables created:"
echo "   - orders (ใบเสร็จ)"
echo "   - member_points_history (ประวัติคะแนน)"
echo ""

echo "📝 Step 2: File Structure"
echo "------------------------"
echo "Created files:"
echo "├── app/receipt/[orderNo]/page.tsx ............ Receipt page"
echo "├── app/api/orders/[orderNo]/route.ts ........ Get order API"
echo "├── app/api/orders/route.ts .................. Create/List orders"
echo "├── lib/order.ts ............................ Helper functions"
echo "├── lib/db-schema.sql ....................... Database schema"
echo "├── lib/seed-orders.ts ...................... Test data (optional)"
echo "└── docs/RECEIPT_FEATURE.md ................. Documentation"
echo ""

echo "🧪 Step 3: Test with cURL"
echo "------------------------"
echo "Create a test order:"
echo ""
echo 'curl -X POST http://localhost:3000/api/orders \'
echo '  -H "Content-Type: application/json" \'
echo "  -d '{
    \"order_no\": \"W6PJYJ-2604003-000033\",
    \"member_code\": \"12345678\",
    \"member_phone\": \"0812345678\",
    \"customer_name\": \"นายประเทศ สุขภาพ\",
    \"items\": [
      {\"name\": \"ผลิตภัณฑ์หลัก\", \"quantity\": 2, \"unit_price\": 1500},
      {\"name\": \"วิตามิน C\", \"quantity\": 1, \"unit_price\": 350}
    ],
    \"subtotal\": 3350,
    \"tax\": 234.5,
    \"total_amount\": 3584.5,
    \"points_earned\": 36,
    \"payment_method\": \"Cash\"
  }'"
echo ""
echo "✅ Then visit: http://localhost:3000/receipt/W6PJYJ-2604003-000033"
echo ""

echo "📱 Step 4: URL Format"
echo "----------------------"
echo "Customer URL:"
echo "https://crm.lifematewellness.com/receipt/{orderNo}"
echo ""
echo "Example:"
echo "https://crm.lifematewellness.com/receipt/W6PJYJ-2604003-000033"
echo ""

echo "🎨 Step 5: Features"
echo "-------------------"
echo "✅ Display order details"
echo "✅ Show customer information"
echo "✅ Show items with calculations"
echo "✅ Display points earned"
echo "✅ Print receipt"
echo "✅ Thai language support"
echo "✅ Responsive design"
echo ""

echo "🔗 API Endpoints"
echo "----------------"
echo "GET  /api/orders/{orderNo} ........... Fetch receipt"
echo "POST /api/orders .................... Create new order"
echo "GET  /api/orders?page=1&limit=20 ... List orders"
echo ""

echo "📚 Documentation"
echo "----------------"
echo "See: docs/RECEIPT_FEATURE.md"
echo ""

echo "❓ Need Help?"
echo "--------------"
echo "1. Check docs/RECEIPT_FEATURE.md for detailed guide"
echo "2. Make sure DATABASE_URL is set in .env"
echo "3. Run 'npm run dev' to start development server"
echo "4. Test API endpoints at http://localhost:3000"
echo ""

echo "✨ Setup Complete!"
