# 🗺️ AutoCommitPush — Roadmap & Feature Ideas

> รวม feature ที่แนะนำให้เพิ่ม จัดกลุ่มตามหมวดหมู่ เรียงจากสำคัญมากไปน้อย

---

## 🔴 High Priority — ควรทำก่อน

### 1. Pull ก่อน Push อัตโนมัติ
- ตอนนี้ถ้า remote มี commit ใหม่ แล้วกด Push จะ fail
- ควรมีปุ่ม **Pull** แยกต่างหากในแต่ละ project card
- หรือให้ถามก่อน push ว่า "ต้องการ pull ก่อนไหม?"

### 2. Branch Management
- ดู branch ทั้งหมดใน repo
- สร้าง branch ใหม่จากในแอป
- Switch branch ได้โดยไม่ต้อง เปิด terminal
- แสดง branch ปัจจุบันชัดเจนกว่านี้

### 3. Commit History
- แสดง git log ของแต่ละ project
- เห็น commit ย้อนหลังได้ (hash, message, author, date)
- คลิก commit เพื่อดู diff ของ commit นั้น
- กด revert commit ได้

### 4. Auto-Push Scheduler
- ตั้งเวลา auto push ได้ เช่น ทุก 30 นาที, ทุกชั่วโมง
- เลือกได้ว่า push เฉพาะตอนมี changes หรือ push ตามเวลาอย่างเดียว
- แสดง countdown ถึง push ครั้งถัดไป
- ปุ่มหยุด/เริ่ม scheduler ต่อ project

### 5. Notification System
- แจ้งเตือน Windows notification ตอน push สำเร็จ/ล้มเหลว
- แจ้งเตือนตอน remote มี commit ใหม่ (someone else pushed)
- เสียงแจ้งเตือน (optional)

---

## 🟡 Medium Priority — ทำในรอบถัดไป

### 6. Stash Management
- `git stash` / `git stash pop` จากในแอป
- ดูรายการ stash ที่มีอยู่
- ตั้งชื่อ stash ได้

### 7. Commit Message Templates
- บันทึก template ที่ใช้บ่อยไว้
- เลือก template ตอนกด push ได้เลย
- แก้ไข/ลบ template ใน Settings

### 8. SSH Key Management
- รองรับการ push ผ่าน SSH key แทน HTTPS token
- Generate SSH key ใหม่ได้จากในแอป
- แสดง public key ให้ copy ไปวางใน GitHub

### 9. .gitignore Generator ที่ดีขึ้น
- มี template สำเร็จรูปเพิ่ม (Go, Java, Flutter, Next.js, etc.)
- ช่อง search/filter template
- Preview ก่อน apply
- Merge กับ .gitignore ที่มีอยู่แล้วได้

### 10. Project Groups / Tags
- จัดกลุ่ม project ได้ เช่น "Work", "Personal", "Client A"
- Filter โดย group ใน sidebar
- สีหรือ icon แตกต่างกันต่อ group

### 11. Bulk Actions
- เลือก project หลายตัวแล้ว push ทีเดียว
- Push all projects ที่มี pending changes พร้อมกัน
- ดู progress ของแต่ละ project แบบ parallel

### 12. Git Submodules Support
- แสดง submodule ใน project
- Update submodule ได้จากในแอป

---

## 🟢 Nice to Have — เพิ่มความสะดวก

### 13. Quick Actions บน System Tray
- Icon ใน system tray
- คลิกขวาเพื่อ push project ล่าสุดได้เลย
- แสดง status ของทุก project จาก tray

### 14. GitHub Issues Integration
- ดู issues ของ repo จากในแอป
- สร้าง issue ใหม่
- Link commit กับ issue ได้ (เช่น `fix #42`)

### 15. GitHub Actions / CI Status
- แสดงสถานะ GitHub Actions run ล่าสุด
- Badge สีเขียว/แดง บอก build status
- คลิกดูรายละเอียด workflow run

### 16. File Watcher แบบ Real-time
- Watch folder แบบ real-time และ auto-stage เมื่อไฟล์เปลี่ยน
- แจ้งเตือนเมื่อมีไฟล์ใหม่เข้ามาใน project
- แยก ignore pattern ต่อ project ได้

### 17. Merge Request / Pull Request Creator
- สร้าง PR บน GitHub จากในแอปได้เลย
- กรอก title, description, base branch, compare branch
- เลือก reviewer, labels, milestone

### 18. Repository Statistics
- กราฟ commit frequency (รายวัน/สัปดาห์/เดือน)
- Top contributors
- ไฟล์ที่เปลี่ยนบ่อยที่สุด
- Lines of code ต่อ language

### 19. Multi-account GitHub Support
- รองรับ GitHub account หลายบัญชี
- Switch account ต่อ project ได้
- รองรับ GitHub Enterprise

### 20. Keyboard Shortcuts
- `Ctrl+P` — เปิด project picker
- `Ctrl+Shift+P` — push project ที่ active อยู่
- `Ctrl+T` — เปิด terminal ของ project
- `Ctrl+L` — ไปหน้า Logs
- ดู shortcut ทั้งหมดได้ใน Settings

---

## 🔵 Terminal Improvements

### 21. Terminal Tabs
- เปิด terminal หลาย tab ใน dialog เดียว
- แต่ละ tab คือ project ที่ต่างกัน
- Rename tab ได้

### 22. Terminal Themes
- เลือก color scheme ได้ (Dracula, One Dark, Solarized, etc.)
- Font size ปรับได้
- เลือก font family ได้

### 23. Terminal Split Pane
- แบ่งหน้าจอ terminal ซ้าย/ขวา หรือ บน/ล่าง
- รันคำสั่งสองอย่างพร้อมกัน

### 24. Terminal History Persistence
- จำ command history ข้าม session ได้
- Search history ด้วย `Ctrl+R`

---

## 🐳 Docker Improvements

### 25. Docker Compose Support
- รัน `docker-compose up/down` จากในแอป
- ดู status ของ containers
- แสดง logs ของแต่ละ container

### 26. Docker Image Manager
- ดู images ที่มีอยู่ในเครื่อง
- ลบ image ที่ไม่ใช้แล้ว
- Pull image จาก Docker Hub

### 27. Multi-tag Push
- Push image หลาย tag พร้อมกัน เช่น `latest`, `v1.0.0`, `stable`

---

## ⚙️ Settings & Configuration

### 28. Export/Import Settings
- Export settings เป็น `.json` เพื่อ backup
- Import settings ในเครื่องใหม่ได้ทันที
- Sync settings ผ่าน GitHub Gist (optional)

### 29. Project-level Settings
- แต่ละ project มี settings ของตัวเอง
- เช่น branch default ต่างกัน, author name ต่างกัน
- Override global settings ต่อ project ได้

### 30. Startup Behavior
- เลือก launch on Windows startup
- Minimize to tray แทน close
- Auto-restore projects ที่เปิดค้างไว้

---

## 🔒 Security

### 31. Token Refresh / Expiry Warning
- แจ้งเตือนเมื่อ GitHub token ใกล้หมดอายุ
- ปุ่ม re-authenticate ที่ทำได้ง่าย

### 32. Audit Log
- บันทึกทุก action ที่ทำ (push, delete, create repo)
- แยก log ต่อ project ได้
- Export audit log

### 33. 2FA Support
- รองรับ GitHub login ผ่าน OAuth flow (ไม่ต้องพิมพ์ token เอง)

---

## 📱 UI/UX

### 34. Resizable Panels
- ปรับขนาด sidebar ได้
- ย่อ/ขยาย diff panel
- Fullscreen mode

### 35. Project Card Customization
- เลือก view แบบ list หรือ grid
- ซ่อน/แสดง field ที่ไม่ต้องการ
- Sort project ตาม name, last push, status

### 36. Onboarding Flow
- Tutorial สำหรับ user ใหม่
- Tooltip แนะนำ feature ต่างๆ
- Quick start guide

### 37. Search ทั่วทั้งแอป
- `Ctrl+K` เปิด global search
- ค้น project, commit, log ได้จากที่เดียว

---

## 🌐 Localization

### 38. รองรับหลายภาษา
- ภาษาไทย
- ภาษาอังกฤษ (มีอยู่แล้ว)
- ภาษาญี่ปุ่น, จีน (ถ้าต้องการ)

---

> **หมายเหตุ:** Feature ที่ทำง่ายและมีผลมากที่สุดคือ **#1 Pull button**, **#4 Auto-Push Scheduler**, **#3 Commit History**, และ **#20 Keyboard Shortcuts** — แนะนำให้ทำตามลำดับนั้นก่อน
