# แก้ไข OAuth Redirect URI Issue

## 🔧 ปัญหาที่พบ

จาก URL ที่เห็น:
```
redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Froblox%2Fcallback
```

ยังใช้ `http://localhost:3000` แทน HTTPS URL จาก ngrok

## ✅ วิธีแก้ไข

### 1. อัปเดต .env.local แล้ว ✅
```env
ROBLOX_REDIRECT_URI=https://2d7a810b4f87.ngrok-free.app/api/auth/roblox/callback
```

### 2. Restart Dev Server

**สำคัญ**: ต้อง restart Next.js dev server เพื่อโหลด environment variables ใหม่

1. หยุด dev server (Ctrl+C)
2. เริ่มใหม่:
```powershell
npm run dev
```

### 3. ตรวจสอบ ngrok Tunnel

ตรวจสอบว่า ngrok ยังรันอยู่:
```powershell
ngrok http 3000
```

ตรวจสอบว่า URL ยังเป็น `https://2d7a810b4f87.ngrok-free.app` หรือไม่
- ถ้าเปลี่ยน ต้องอัปเดต Roblox Dashboard และ `.env.local`

### 4. ทดสอบอีกครั้ง

1. ไปที่: `https://2d7a810b4f87.ngrok-free.app/login`
2. คลิก "Login with Roblox"
3. ตรวจสอบว่า redirect URI ใน URL เป็น HTTPS แล้ว

## 🔍 ตรวจสอบว่าแก้ไขแล้ว

หลังจาก restart dev server:
1. URL ที่ redirect ไป Roblox ควรเป็น:
```
https://authorize.roblox.com/v1/authorize?...&redirect_uri=https%3A%2F%2F2d7a810b4f87.ngrok-free.app%2Fapi%2Fauth%2Froblox%2Fcallback&...
```

2. ไม่ควรเห็น `localhost:3000` ใน redirect URI อีก

## ⚠️ Client-Side Error

ถ้ายังมี client-side error:
1. เปิด browser console (F12)
2. ดู error message ที่แน่นอน
3. ตรวจสอบว่า:
   - ngrok tunnel ยังรันอยู่
   - Next.js dev server รันอยู่
   - Environment variables โหลดถูกต้อง

## 📋 Checklist

- [ ] อัปเดต `.env.local` ด้วย HTTPS redirect URI ✅
- [ ] Restart Next.js dev server
- [ ] ตรวจสอบ ngrok tunnel ยังรันอยู่
- [ ] ตรวจสอบ ngrok URL ตรงกับ Roblox Dashboard
- [ ] ทดสอบ OAuth flow อีกครั้ง
- [ ] ตรวจสอบ redirect URI ใน URL เป็น HTTPS

