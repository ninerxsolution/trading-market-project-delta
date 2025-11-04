# สร้าง OAuth App ใหม่สำหรับทดสอบ

## 🎯 เหตุผล

App ปัจจุบันอยู่ในสถานะ "In Review" และอาจจะยังใช้ OAuth ไม่ได้จนกว่า review จะเสร็จ

**วิธีแก้**: สร้าง OAuth app ใหม่สำหรับทดสอบ (ไม่ submit)

## 📝 ขั้นตอน

### Step 1: สร้าง OAuth App ใหม่

1. ไปที่: https://create.roblox.com/dashboard/credentials
2. คลิก **"Create OAuth 2.0 Application"** หรือ **"New Application"**
3. กรอกข้อมูล:
   - **Application Name**: `Trading Market App - Test` (หรือชื่ออื่น)
   - **Description**: `Roblox item trading marketplace - Development/Testing`
   - **Entry Link**: `https://2d7a810b4f87.ngrok-free.app`
   - **Privacy Policy URL**: `https://2d7a810b4f87.ngrok-free.app/privacy`
   - **Terms of Service URL**: `https://2d7a810b4f87.ngrok-free.app/terms`

### Step 2: ตั้งค่า Redirect URI

1. ในส่วน **"Redirect URIs"** เพิ่ม:
   ```
   https://2d7a810b4f87.ngrok-free.app/api/auth/roblox/callback
   ```
2. **สำคัญ**: ต้องตรงกันเป๊ะๆ (ไม่มี trailing slash)

### Step 3: เลือก Scopes

1. ในส่วน **"Permissions"** หรือ **"Scopes"**
2. เลือก:
   - ✅ `openid`
   - ✅ `profile`

### Step 4: เก็บ Client ID และ Secret

1. หลังจากสร้าง app แล้ว
2. **คัดลอก Client ID และ Client Secret**
3. **อย่า submit** - ใช้สำหรับทดสอบเท่านั้น

### Step 5: อัปเดต Environment Variables

อัปเดต `.env.local` ด้วย Client ID และ Secret ใหม่:

```env
ROBLOX_CLIENT_ID=<CLIENT_ID_NEW>
ROBLOX_CLIENT_SECRET=<CLIENT_SECRET_NEW>
ROBLOX_REDIRECT_URI=https://2d7a810b4f87.ngrok-free.app/api/auth/roblox/callback
```

### Step 6: Restart Dev Server

1. หยุด dev server (Ctrl+C)
2. เริ่มใหม่:
```powershell
npm run dev
```

### Step 7: ทดสอบ OAuth

1. ไปที่: `https://2d7a810b4f87.ngrok-free.app/login`
2. คลิก "Login with Roblox"
3. ควรจะใช้งานได้แล้ว!

## ✅ Checklist

- [ ] สร้าง OAuth app ใหม่
- [ ] ตั้งค่า Entry Link, Privacy Policy, Terms
- [ ] เพิ่ม Redirect URI
- [ ] เลือก scopes (openid, profile)
- [ ] **ไม่ submit** app
- [ ] เก็บ Client ID และ Secret
- [ ] อัปเดต `.env.local`
- [ ] Restart dev server
- [ ] ทดสอบ OAuth flow

## ⚠️ หมายเหตุ

- App ใหม่นี้ใช้สำหรับทดสอบเท่านั้น
- **ไม่ต้อง submit** - จะใช้งานได้ทันที
- เมื่อ review app เก่าหมด จะสามารถใช้ app เก่าได้
- ถ้า ngrok URL เปลี่ยน ต้องอัปเดต Roblox Dashboard

## 🎯 ข้อดี

- ✅ ใช้งานได้ทันที (ไม่ต้องรอ review)
- ✅ ทดสอบได้เลย
- ✅ ไม่กระทบ app เก่าที่อยู่ใน review

