# Laptop Shop Backend API (TLCN-Mern)

Đây là mã nguồn phần Backend cho hệ thống website thương mại điện tử mua bán Laptop (Đồ án Thực tập cơ sở/Tiểu luận chuyên ngành). Hệ thống được xây dựng dựa trên kiến trúc **RESTful API** sử dụng **Node.js, Express và MongoDB**.

## 🚀 Công nghệ sử dụng
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Sử dụng `mongoose`)
- **Authentication:** JSON Web Token (JWT) & Passport (Google OAuth2)
- **Image Hosting:** Cloudinary
- **Security:** `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`
- **Email Service:** Nodemailer

## 📁 Cấu trúc thư mục
```
TLCN-backend/
├── controllers/    # Xử lý logic của các API (Auth, Product, Order...)
├── models/         # Định nghĩa cấu trúc dữ liệu MongoDB (Schema)
├── routes/         # Khai báo các đường dẫn API (Endpoints)
├── utils/          # Các hàm hỗ trợ (Email, Upload ảnh, Xử lý lỗi...)
├── views/          # Các template EJS (nếu có sử dụng render web/email)
├── config.env      # File chứa các biến môi trường (Cần tạo)
├── app.js          # File cấu hình chính của Express
└── server.js       # File khởi chạy server và kết nối Database
```

## ⚙️ Hướng dẫn cài đặt và chạy máy chủ (Local)

### 1. Cài đặt thư viện
Hãy chắc chắn rằng máy bạn đã cài đặt Node.js. Mở terminal tại thư mục `TLCN-backend` và chạy lệnh sau:
```bash
npm install
```

### 2. Cấu hình biến môi trường
Mặc định dự án sử dụng file `config.env` để lưu trữ cấu hình. Đảm bảo file này tồn tại trong thư mục gốc của backend với nội dung mẫu như sau:
```env
PORT=5000

# Cấu hình Database
DATABASE=mongodb://127.0.0.1:27017/laptopshop
DATABASE_PASSWORD=

# Cấu hình JWT
JWT_SECRET=chuoi_bi_mat_cua_ban
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Cấu hình Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=email_cua_ban@gmail.com
EMAIL_PASSWORD=mat_khau_ung_dung_gmail
EMAIL_FROM=Laptop Shop <email_cua_ban@gmail.com>

# Cấu hình Google Login (Tùy chọn)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
*(Lưu ý: Bạn cần tạo CSDL MongoDB local có tên `laptopshop` hoặc đổi sang chuỗi kết nối của MongoDB Cloud nếu muốn).*

### 3. Khởi chạy Server
Dự án đã tích hợp sẵn `nodemon` để tự động khởi động lại server khi bạn sửa code.

**Chạy ở chế độ Development (Dev):**
```bash
npm start
```
Nếu thành công, terminal sẽ hiện thông báo:
```
DB connection successful!
App running on port 5000...
```

**Chạy ở chế độ Production:**
```bash
npm run start:prod
```

## 🔗 Các API chính (Endpoints)
Base URL: `http://localhost:5000/api/v1`

- **Xác thực:** `/users/signup`, `/users/login`, `/users/logout`
- **Sản phẩm:** `/products`
- **Đơn hàng:** `/orders`
- **Đánh giá & Bình luận:** `/reviews`, `/comments`
- **Danh mục & Thương hiệu:** `/categories`, `/brands`

*Mở file `app.js` để xem danh sách toàn bộ các route được kết nối.*
