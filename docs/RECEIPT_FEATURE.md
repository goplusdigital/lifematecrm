# ใบเสร็จการสั่งซื้อ (Receipt Page) - ระบบ GOCRM

## 📋 ข้อมูลทั่วไป

หน้า Receipt นี้ใช้สำหรับแสดงรายละเอียดการสั่งซื้อและคะแนนของลูกค้า หลังจากที่ลูกค้าสแกน QR Code เพื่อตรวจสอบการสั่งซื้อ

### 🎯 ฟีเจอร์หลัก
- ✅ แสดงรายละเอียดใบเสร็จ (เลขที่ใบเสร็จ, วันที่, ลูกค้า)
- ✅ แสดงรายการสินค้า พร้อมราคา
- ✅ แสดงคะแนนที่ได้รับจากการซื้อ
- ✅ แสดงคะแนนรวมของลูกค้า
- ✅ การคำนวณราคาอัตโนมัติ (รวม ส่วนลด ภาษี)
- ✅ ฟังก์ชันพิมพ์ใบเสร็จ
- ✅ รองรับภาษาไทย พร้อม format ตัวเลขและวันที่
- ✅ Responsive Design (Mobile & Desktop)

---

## 🗄️ ฐานข้อมูล

### 1. สร้าง Tables

รันไฟล์ SQL ต่อไปนี้ใน Supabase PostgreSQL:

```bash
# File: lib/db-schema.sql
```

**Tables ที่สร้าง:**

#### `orders` (ใบเสร็จ)
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  member_code VARCHAR(20),
  member_phone VARCHAR(20),
  customer_name VARCHAR(255),
  items JSONB NOT NULL,           -- [{name, quantity, unit_price, total}]
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  points_earned INT,
  discount_amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `member_points_history` (ประวัติคะแนน)
```sql
CREATE TABLE member_points_history (
  id SERIAL PRIMARY KEY,
  member_code VARCHAR(20),
  order_no VARCHAR(50),
  points_delta INT,
  points_type VARCHAR(20),
  description VARCHAR(255),
  created_at TIMESTAMP
);
```

---

## 🔌 API Routes

### 1. ดึงข้อมูลใบเสร็จ
**GET** `/api/orders/{orderNo}`

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "order_no": "W6PJYJ-2604003-000033",
      "member_code": "12345678",
      "items": [
        { "name": "ผลิตภัณฑ์", "quantity": 2, "unit_price": 1500, "total": 3000 }
      ],
      "subtotal": 3000,
      "tax": 210,
      "total_amount": 3210,
      "points_earned": 32,
      "created_at": "2024-04-20T10:30:00Z"
    },
    "member": {
      "member_code": "12345678",
      "member_name": "นายประเทศ สุขภาพ",
      "member_phone": "0812345678",
      "member_point": 150,
      "member_email": "user@example.com"
    }
  }
}
```

### 2. สร้างใบเสร็จใหม่
**POST** `/api/orders`

**Request Body:**
```json
{
  "order_no": "W6PJYJ-2604003-000033",
  "member_code": "12345678",
  "member_phone": "0812345678",
  "customer_name": "นายประเทศ สุขภาพ",
  "items": [
    { "name": "ผลิตภัณฑ์", "quantity": 2, "unit_price": 1500 }
  ],
  "subtotal": 3000,
  "tax": 210,
  "total_amount": 3210,
  "points_earned": 32,
  "payment_method": "Cash",
  "discount_amount": 0
}
```

### 3. ดึงรายชื่อใบเสร็จ (Pagination)
**GET** `/api/orders?page=1&limit=20`

---

## 🛠️ Helper Functions

### ไฟล์: `lib/order.ts`

#### `createOrder(orderData)` 
สร้างใบเสร็จใหม่ และ update คะแนนของสมาชิก

```typescript
import { createOrder, calculatePoints } from '@/lib/order'

const order = await createOrder({
  order_no: 'W6PJYJ-2604003-000033',
  member_code: '12345678',
  items: [{ name: 'Product', quantity: 2, unit_price: 1500 }],
  subtotal: 3000,
  total_amount: 3210,
  points_earned: 32
})
```

#### `getOrderByNumber(orderNo)`
ดึงข้อมูลใบเสร็จจากเลขที่ใบเสร็จ

```typescript
const order = await getOrderByNumber('W6PJYJ-2604003-000033')
```

#### `calculatePoints(amount, pointsPerBaht)`
คำนวนคะแนนจากจำนวนเงิน (ค่าเริ่มต้น: 1 คะแนน ต่อ 100 บาท)

```typescript
const points = calculatePoints(3210, 0.01) // ผลลัพธ์: 32 คะแนน
```

#### `getMemberPointsHistory(memberCode, limit)`
ดึงประวัติคะแนนของสมาชิก

---

## 📱 UI Pages

### `/receipt/[orderNo]` - หน้าแสดงใบเสร็จ

**Features:**
- 🎨 Header ที่ประดับด้วยโลโก้บริษัท
- 📊 ตารางแสดงรายการสินค้า
- 💰 สรุปราคา (ยอดรวม ส่วนลด ภาษี)
- ⭐ ส่วนแสดงคะแนนที่ได้รับ
- 👤 ข้อมูลลูกค้า (ชื่อ โทรศัพท์ รหัสสมาชิก)
- 🖨️ ปุ่มพิมพ์ใบเสร็จ
- 📱 Responsive design

**Loading State:**
- แสดง Skeleton Loader ขณะรอข้อมูล
- Smooth transition เมื่อข้อมูลโหลดเสร็จ

**Error Handling:**
- แสดงข้อความเมื่อไม่พบใบเสร็จ
- ปุ่มกลับหน้าแรก

---

## 🧪 การทดสอบ

### 1. เพิ่มข้อมูลทดสอบ

ใช้ API เพื่อสร้างใบเสร็จทดสอบ:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_no": "W6PJYJ-2604003-000033",
    "member_code": "12345678",
    "member_phone": "0812345678",
    "customer_name": "Test User",
    "items": [
      {"name": "ผลิตภัณฑ์", "quantity": 2, "unit_price": 1500}
    ],
    "subtotal": 3000,
    "tax": 210,
    "total_amount": 3210,
    "points_earned": 32,
    "payment_method": "Cash"
  }'
```

### 2. ตรวจสอบใบเสร็จ
ไปที่: `http://localhost:3000/receipt/W6PJYJ-2604003-000033`

### 3. ทดสอบการพิมพ์
- คลิกปุ่ม "พิมพ์ใบเสร็จ"
- ตรวจสอบ Print Preview

---

## 💡 ตัวอย่างข้อมูล (Sample Data)

```typescript
const sampleOrder = {
  order_no: 'W6PJYJ-2604003-000033',
  member_code: '12345678',
  member_phone: '0812345678',
  customer_name: 'นายประเทศ สุขภาพ',
  items: [
    { name: 'ผลิตภัณฑ์หลักร่างกาย', quantity: 2, unit_price: 1500 },
    { name: 'ผลิตภัณฑ์บำรุงเหงือก', quantity: 1, unit_price: 800 },
    { name: 'วิตามิน C 1000mg', quantity: 1, unit_price: 350 }
  ],
  subtotal: 4150,
  tax: 290.5,
  discount_amount: 0,
  total_amount: 4440.5,
  points_earned: 44,
  payment_method: 'Cash',
  payment_status: 'completed',
  notes: 'ขอบคุณที่มาใช้บริการ'
}
```

---

## 🔐 Security & Considerations

- ✅ JWT Authentication สำหรับ API (Recommended)
- ✅ Validate order_no format ก่อนค้นหา
- ✅ CORS configuration ถ้า API แยกต่างหาก
- ✅ Rate limiting สำหรับ API endpoint
- ✅ Audit trail สำหรับ points transactions

---

## 🎨 Customization

### เปลี่ยนสูตรคำนวณคะแนน

Edit `lib/order.ts`:
```typescript
// เปลี่ยนจาก 1 คะแนนต่อ 100 บาท เป็น 1 คะแนนต่อ 50 บาท
export function calculatePoints(amount: number): number {
  return Math.floor(amount * 0.02) // 0.02 = 1 point per 50 THB
}
```

### เปลี่ยนสีและธีม

Edit `app/receipt/[orderNo]/page.tsx`:
```typescript
// เปลี่ยนสี gradient header
<div className="bg-gradient-to-r from-green-600 to-green-700 ...">
```

---

## 📝 Notes

- 📌 ต้องสร้าง `members` table ก่อน (จากกระบวนการ register)
- 📌 Points จะอัปเดตอัตโนมัติเมื่อสร้างใบเสร็จใหม่
- 📌 ใบเสร็จไม่สามารถแก้ไขได้หลังจากสร้าง (immutable)
- 📌 Print styles ได้รับการปรับแต่งสำหรับ A5 thermal printer

---

## ❓ FAQ

**Q: จะปรับเปลี่ยนข้อมูลใบเสร็จหลังจากสร้างได้ไหม?**
A: ไม่ได้ เพื่อความสมบูรณ์ของบันทึก สามารถค้นหาและแสดง แต่ไม่ควรแก้ไข ถ้าต้องแก้ไข ควรสร้างใบเสร็จใหม่

**Q: คะแนนจะลบได้ไหมถ้าใบเสร็จถูกยกเลิก?**
A: ต้องเพิ่ม API endpoint สำหรับการรีเฟันด์/ยกเลิก ที่จะลบคะแนนกลับ

**Q: รองรับหลายสกุลเงินได้ไหม?**
A: ปัจจุบัน hardcoded สำหรับ THB ต้องเปลี่ยนเป็น dynamic ถ้าต้องการสกุลอื่น

---

## 🚀 Next Steps

- [ ] เพิ่ม Discount Codes integration
- [ ] เพิ่ม Refund/Return functionality
- [ ] เพิ่ม Email receipt feature
- [ ] เพิ่ม Analytics dashboard
- [ ] เพิ่ม Tax compliance reports

