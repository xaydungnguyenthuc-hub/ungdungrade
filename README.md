# 📝 RA ĐỀ KIỂM TRA AI – 3 CẤP

Ứng dụng web giúp giáo viên Việt Nam tạo nhanh **đề kiểm tra, ma trận, bản đặc tả, đáp án và hướng dẫn chấm** cho **Tiểu học • THCS • THPT – mọi môn học**, với sự hỗ trợ của AI (Claude).

Ứng dụng là web tĩnh (HTML + CSS + JavaScript thuần), không cần máy chủ, không cần cài đặt.

## Tính năng chính

- Thiết lập từng bước: cấp học → lớp → môn (hoặc nhập môn khác) → nội dung/tài liệu → loại đề → dạng câu → mức độ & thang điểm → nâng cao.
- **Tài liệu tham chiếu**: PDF (có lớp chữ), Word `.docx`, TXT, hình ảnh, hoặc dán nội dung. Ba chế độ nguồn kiến thức, trong đó chế độ "chỉ dùng tài liệu" sẽ báo thiếu dữ liệu thay vì tự bịa.
- **7 dạng câu**: trắc nghiệm 4 lựa chọn, nhiều đáp án đúng, đúng/sai, ghép nối, điền khuyết, trả lời ngắn và 10 kiểu tự luận.
- **Mức độ**: Nhận biết – Thông hiểu – Vận dụng – Vận dụng cao, nhập theo số câu hoặc theo %.
- **Điểm và ma trận tính bằng chương trình** (không để AI đoán): chia điểm theo trọng số, theo từng phần hoặc đều nhau; ma trận và bản đặc tả được tính trực tiếp từ đề nên luôn khớp.
- **34 mẫu cấu trúc đề** (6 mẫu chung và 28 mẫu theo môn: Toán, Ngữ văn, Tiếng Việt, Tiếng Anh, Vật lí, Hóa học, Sinh học, KHTN, Lịch sử, Địa lí, GDCD/KT-PL, Tin học, Công nghệ, Âm nhạc/Mĩ thuật…).
- **Quy trình tự kiểm tra 12 hạng mục**: AI tự giải lại từng câu, kiểm tra cấu trúc, trùng lặp, phạm vi, chính tả; câu lỗi được tự tạo lại; câu chưa chắc chắn được đánh dấu "⚠ Cần giáo viên kiểm tra".
- **Nhiều mã đề** (101–104): đảo câu, đảo đáp án, mỗi mã đề có bảng đáp án riêng.
- **Thao tác từng câu**: tạo lại, chỉnh sửa, xóa, thêm câu, lưu vào ngân hàng; tạo đề tương đương; hoàn tác và lịch sử phiên bản.
- **Ngân hàng câu hỏi** (lọc, sửa, nhân bản, xuất/nhập JSON), **số câu theo chủ đề**, **tải ma trận có sẵn**, **giữ nguyên câu giáo viên đã nhập**.
- **Xuất**: Word `.docx` thật (đề, đáp án + hướng dẫn chấm, ma trận + đặc tả, phiếu trả lời), HTML, JSON; in A4 có đánh số trang; sao chép dán vào Word/Google Docs.
- Lưu cấu hình và đề bằng `localStorage`; giao diện responsive, hỗ trợ chế độ tối.

## Cấu trúc thư mục

```
.
├── index.html            # Giao diện chính
├── css/style.css         # Giao diện
├── js/
│   ├── standalone.js     # Chế độ độc lập: gọi Anthropic API bằng khóa của người dùng + tải tệp
│   ├── core.js           # Dữ liệu, tiện ích, lập kế hoạch đề/ma trận, chia điểm, chuẩn hóa & kiểm tra câu hỏi, mã đề
│   ├── ai.js             # Lời nhắc (prompt), gọi AI, quy trình tạo đề, kiểm tra 12 hạng mục, ma trận
│   ├── setup.js          # Cửa sổ, lưu trữ, bảng thiết lập, tải tài liệu
│   ├── docx.js           # Xuất .docx (JSZip, tự dựng XML)
│   └── app.js            # Hiển thị đề, thao tác từng câu, ngân hàng, xuất/in, sự kiện, khởi tạo
├── tests/smoke.js        # Kiểm thử nhanh (Playwright, giả lập API)
├── .github/workflows/pages.yml   # Tự triển khai lên GitHub Pages
├── package.json  LICENSE  .nojekyll  .gitignore
```

Phân tách theo yêu cầu: dữ liệu đầu vào (`setup.js`) → logic tạo đề (`core.js`, `ai.js`) → logic kiểm tra (`ai.js`, `core.js`) → dữ liệu kết quả (`S.exam`) → hiển thị (`app.js`).

## Chạy trên máy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy máy chủ tĩnh:

```bash
python3 -m http.server 8080
# mở http://localhost:8080
```

## Triển khai lên GitHub Pages

1. Tạo repository mới trên GitHub và đẩy toàn bộ tệp lên nhánh `main`:
   ```bash
   git init
   git add .
   git commit -m "Ra đề kiểm tra AI – 3 cấp"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
   git push -u origin main
   ```
2. Vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**. Workflow `.github/workflows/pages.yml` sẽ tự triển khai mỗi lần push.
   (Hoặc chọn *Deploy from a branch* → `main` → `/ (root)`; khi đó có thể xóa thư mục `.github`.)
3. Địa chỉ trang: `https://<tài-khoản>.github.io/<tên-repo>/`.

## Cấu hình AI (quan trọng)

Khi chạy ngoài Claude.ai, ứng dụng gọi **Anthropic Messages API** trực tiếp từ trình duyệt.

1. Tạo khóa API tại <https://console.anthropic.com/>.
2. Mở ứng dụng, bấm **⚙ Cài đặt AI** ở thanh trên cùng, dán khóa, bấm **Kiểm tra kết nối** rồi **Lưu**.
3. Model mặc định: `claude-sonnet-5-5` (soạn và kiểm tra đề), `claude-haiku-5-5` (đọc ảnh). Có thể đổi trong cùng hộp thoại.

**Lưu ý bảo mật:**
- Khóa API chỉ nằm trong `localStorage` của trình duyệt người dùng. **Không bao giờ ghi khóa vào mã nguồn hoặc commit lên GitHub.**
- Gọi API trực tiếp từ trình duyệt đồng nghĩa người dùng phải tự có khóa. Với triển khai cho nhiều giáo viên của một trường, nên dựng một máy chủ trung gian (proxy) giữ khóa ở phía máy chủ rồi sửa hàm `call()` trong `js/standalone.js` để trỏ tới proxy đó, kèm đăng nhập và giới hạn lượt dùng.
- Chi phí gọi API do chủ khóa chịu.

Trong Claude.ai (khi dán mã này làm artifact), đối tượng `window.claude` đã có sẵn nên không cần khóa; tệp `standalone.js` tự bỏ qua.

## Kiểm thử

```bash
npm install
npx playwright install chromium
npm test
```

Kiểm thử giả lập Anthropic API, chạy luồng chọn môn → áp mẫu → tạo đề → xem 6 tab → xuất `.docx`.

## Giới hạn đã biết

- PDF dạng ảnh scan và tệp Word `.doc` cũ không đọc được; hãy dùng ảnh, `.docx` hoặc dán nội dung.
- Đề do AI soạn. **Giáo viên phải kiểm duyệt nội dung, đáp án và mức độ trước khi dùng chính thức.**
- Các mẫu cấu trúc đề là gợi ý phổ biến, không phải quy định chính thức; hãy điều chỉnh theo ma trận của trường.
- Hộp thoại in và tải tệp phụ thuộc trình duyệt; nếu bị chặn, dùng nút **Sao chép** rồi dán vào Word/Google Docs.

## Giấy phép

MIT – xem [LICENSE](LICENSE). Nhớ thay `<Tên của bạn>` trong tệp này.
