# ShopLite

Mini-project xuyên suốt của **lộ trình Frontend 18 ngày**. ShopLite là một cửa hàng
bán hàng online thu nhỏ, được xây lại và *tiến hóa* qua từng module công nghệ —
không làm lại từ đầu mỗi lần.

| Module | Công nghệ | Thư mục | Trạng thái |
| --- | --- | --- | --- |
| 1 | HTML / CSS / Tailwind | `v1-html/` | ✅ xong (tag `v1-html`) |
| 2 | JavaScript | `v2-js/` | ⏳ chưa bắt đầu |
| 3 | TypeScript + Vite | `v3-ts/` | ⏳ |
| 4 | ReactJS | `v4-react/` | ⏳ |
| 5 | Next.js | `v5-next/` | ⏳ |

## Chạy local

Không cần build tool ở module 1 — mở file trực tiếp là được:

```bash
start v1-html/index.html      # Windows
open  v1-html/index.html      # macOS
```

Hoặc chạy qua server tĩnh (nên dùng, để đường dẫn tương đối giống môi trường thật):

```bash
npx serve .
# rồi mở http://localhost:3000/v1-html/index.html
```

## Cấu trúc thư mục

```
shoplite/
├─ docs/                     tài liệu lộ trình (bản lưu offline của S*Learn)
├─ labs/module-1/            9 bài tập luyện tay — code để HỌC, không phải sản phẩm
│  └─ index.html             trang mục lục mở tất cả lab
└─ v1-html/                  DELIVERABLE module 1: ShopLite bản tĩnh
   ├─ index.html             danh sách sản phẩm
   ├─ product.html           chi tiết sản phẩm
   ├─ cart.html              giỏ hàng
   ├─ assets/images/         ảnh local (logo, icon)
   └─ css/
      ├─ tokens.css          design system: MỌI màu/spacing/radius/shadow
      ├─ base.css            reset, box-sizing, mặc định cho thẻ HTML
      ├─ layout.css          container, header, nav, footer, grid từng trang
      └─ components.css      btn, product-card, badge, qty, summary...
```

Hai vùng tách biệt có chủ đích:

- **`labs/`** — bài tập một lần, mỗi lab một thư mục tự chứa, CSS viết luôn trong
  `<style>`. Bẩn cũng được, miễn chứng minh được một khái niệm.
- **`v1-html/`** — sản phẩm thật, sẽ được module 2 kế thừa. CSS tách 4 file, không
  có giá trị cứng, không trộn Tailwind (Tailwind chỉ xuất hiện trong lab 3.3).

**Thứ tự nạp CSS bắt buộc:** `tokens → base → layout → components`. Nạp bằng 4 thẻ
`<link>` (không dùng `@import` trong CSS vì nó nạp tuần tự, chậm).

Thanh danh mục dùng `.nav-link` — tab gạch chân, không phải chip pill. Border dưới
trong suốt được khai báo sẵn để hover không làm layout nhảy.

## Quy ước code

- **Ngôn ngữ:** toàn bộ HTML, nội dung giao diện và comment (HTML + CSS) viết bằng
  **tiếng Anh**. `README.md` là tài liệu duy nhất dùng tiếng Việt.
- Thư mục và file: `kebab-case`.
- Class CSS: BEM nhẹ — `.product-card`, `.product-card__price`, `.btn--primary`.
- Không viết giá trị màu/spacing cứng ngoài `tokens.css`.
- Không dùng `<div>` nếu còn thẻ semantic đúng nghĩa hơn.
- Header/footer bị lặp lại ở cả 3 trang: HTML thuần không có cách tránh. Giữ markup
  **giống hệt nhau** giữa các trang để module 4 cắt thành component React được ngay.

## Module 1 — đối chiếu tiêu chí "done"

| Tiêu chí | Hiện thực ở đâu |
| --- | --- |
| HTML semantic, đúng một `<main>`, heading không nhảy bậc | cả 3 trang trong `v1-html/` |
| Accessibility cơ bản: `alt`, `label`, thứ tự heading, skip-link, focus ring | `base.css` (`:focus-visible`, `.skip-link`, `.visually-hidden`) |
| Lưới sản phẩm tự đổi số cột **không dùng media query** | `.product-grid` — `repeat(auto-fill, minmax(220px, 1fr))` |
| Card cao bằng nhau, nút "Add to cart" thẳng đáy | `.product-card` flex dọc + `.product-card .btn { margin-top: auto }` |
| Chi tiết sản phẩm 2 cột desktop → 1 cột mobile | `.product-detail` + `@media (min-width: 900px)` |
| Giỏ hàng 2 cột desktop → xếp dọc mobile | `.cart-layout` + `@media (min-width: 960px)` |
| Navbar không vỡ từ 360px | `.nav-list { overflow-x: auto }` + `.nav-list li { flex: 0 0 auto }`, header đổi grid-areas ở 640px |
| Toàn bộ màu/spacing/radius từ **một** bộ CSS variables | `tokens.css` |
| Dark mode bật/tắt chỉ bằng đổi biến | `tokens.css` — `.dark, :root:has(#theme-toggle:checked)`; công tắc ở header, pure CSS |
| `hover` / `focus` cho mọi phần tử tương tác | `components.css` + `:focus-visible` trong `base.css` |
| Dựng card bằng Tailwind và đối chiếu class ↔ CSS | `labs/module-1/day-3-tailwind-card/` |
| Responsive mượt 360px → ≥1280px | `clamp()` cho typography, mobile-first ở mọi media query |

Dark mode ở module 1 không lưu được lựa chọn khi chuyển trang (cần
`localStorage` → module 2).

## Ảnh sản phẩm

Đang dùng ảnh placeholder từ `picsum.photos` (cần mạng). Module 2 sẽ thay bằng dữ
liệu thật từ [DummyJSON](https://dummyjson.com/docs/products).

## Tài liệu

Lộ trình gốc: `docs/S_Learn.mhtml` (bản lưu offline từ S*Learn).
