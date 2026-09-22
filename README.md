# ShopLite

Mini-project xuyên suốt của **lộ trình Frontend 18 ngày**. ShopLite là một cửa hàng
bán hàng online thu nhỏ, được xây lại và *tiến hóa* qua từng module công nghệ —
không làm lại từ đầu mỗi lần.

| Module | Công nghệ | Thư mục | Trạng thái |
| --- | --- | --- | --- |
| 1 | HTML / CSS / Tailwind | `v1-html/` | ✅ xong (tag `v1-html`) |
| 2 | JavaScript | `v2-js/` | ✅ xong (tag `v2-js`) |
| 3 | TypeScript + Vite | `v3-ts/` | ⏳ |
| 4 | ReactJS | `v4-react/` | ⏳ |
| 5 | Next.js | `v5-next/` | ⏳ |

## Chạy local

**Từ module 2 trở đi bắt buộc chạy qua server tĩnh.** `v2-js/` dùng
`<script type="module">` và gọi API — mở bằng `file://` sẽ chết ngay ở console
với lỗi CORS.

```bash
npx serve .
# http://localhost:3000/v1-html/index.html   module 1 (tĩnh)
# http://localhost:3000/v2-js/index.html     module 2
# http://localhost:3000/labs/module-2/       10 lab của module 2
```

Riêng `v1-html/` vẫn mở trực tiếp được vì không có JavaScript:

```bash
start v1-html/index.html      # Windows
open  v1-html/index.html      # macOS
```

## Cấu trúc thư mục

```
shoplite/
├─ docs/                     tài liệu lộ trình (bản lưu offline của S*Learn)
├─ labs/
│  ├─ module-1/              9 bài tập HTML/CSS
│  └─ module-2/              10 bài tập JavaScript
│     └─ index.html          trang mục lục mở tất cả lab
├─ v2-js/                    DELIVERABLE module 2: ShopLite bản động (xem bên dưới)
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
  `<style>` và JS trong `<script>`. Bẩn cũng được, miễn chứng minh được một khái
  niệm.
- **`v1-html/` và `v2-js/`** — sản phẩm thật. Mỗi module copy thư mục của module
  trước rồi tiến hóa tiếp, nên bản cũ vẫn mở được để đối chiếu. CSS tách 4 file,
  không có giá trị cứng, không trộn Tailwind (Tailwind chỉ xuất hiện trong lab 3.3).

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
- JavaScript: `const` mặc định, không dùng `var`; mỗi file một việc và export ra
  ngoài bằng ES module; hàm xử lý dữ liệu phải **thuần** (không đụng DOM, không sửa
  tham số đầu vào) để module 3–5 tái dùng nguyên vẹn.
- Mọi chuỗi lấy từ API đều đi qua `escapeHTML()` trước khi vào `innerHTML`.

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
`localStorage`) — module 2 đã xử lý, xem bên dưới.

## Module 2 — JavaScript

`v2-js/` bắt đầu bằng bản copy nguyên vẹn của `v1-html/`: cùng 4 file CSS, cùng
markup header/footer. Thay đổi duy nhất về giao diện là **toàn bộ card sản phẩm
đã bị xóa khỏi HTML** — giờ JS dựng ra hết.

```
v2-js/
├─ index.html      lưới sản phẩm (rỗng trong HTML, JS đổ dữ liệu vào)
├─ product.html    chi tiết — một file phục vụ mọi sản phẩm qua ?id=
├─ cart.html       giỏ hàng đọc từ localStorage
├─ css/            4 file của module 1 + phần thêm cuối components.css
│                  (skeleton, empty/error state, toast, ô sort)
└─ js/
   ├─ data.js        12 sản phẩm mẫu, đúng shape DummyJSON — nguồn dự phòng
   ├─ products.js    HÀM THUẦN: filterByKeyword, sortByPrice, applyFilters...
   ├─ api.js         getJSON (có kiểm tra res.ok + timeout), fetchProducts...
   ├─ storage.js     localStorage bọc try/catch, không bao giờ ném ra ngoài
   ├─ cart.js        addToCart, removeFromCart, updateQty, getCartTotal
   ├─ ui.js          productCardHTML, renderProducts, badge, theme, toast
   ├─ home.js        điều khiển index.html
   ├─ detail.js      điều khiển product.html
   └─ cart-page.js   điều khiển cart.html
```

**Luồng dữ liệu** — mỗi trang chỉ có một `state` và một `render()`. Sự kiện sửa
state rồi gọi lại `render()`; không có chỗ nào vá DOM thủ công:

```
fetch (api.js) ─► state.all ─► applyFilters(state) ─► renderProducts() ─► innerHTML
                                      ▲                                      │
                          input / click / change ◄──── event delegation ◄─────┘
```

**Ba quyết định đáng nhớ:**

- **Dữ liệu thật, có đường lui.** Sản phẩm lấy từ `GET /products` của DummyJSON.
  Nếu fetch hỏng (rớt mạng, API chết), trang hiện thông báo lỗi kèm nút thử lại
  *và* vẫn render `data.js` — không bao giờ có màn hình trắng.
- **`fetch` không tự ném lỗi khi 404/500.** Mọi request đi qua `getJSON()`, nơi
  `res.ok` được kiểm tra bằng tay và `AbortController` cắt request treo sau 10s.
- **Một listener cho cả lưới.** Card bị tạo lại sau mỗi lần render nên listener
  gắn vào từng nút sẽ chết theo. Listener nằm ở container, `event.target.closest(
  '[data-id]')` truy ngược ra sản phẩm.

**Khóa trong localStorage:**

| Khóa | Nội dung |
| --- | --- |
| `shoplite.cart` | mảng dòng giỏ `{ id, title, price, thumbnail, category, qty }` |
| `shoplite.theme` | `"dark"` / `"light"` — dark mode giờ nhớ được qua các trang |
| `shoplite.categories` | danh mục API trả về, để 2 trang kia vẽ nav mà không gọi lại API |

Dữ liệu hỏng trong localStorage (JSON sai, ai đó sửa tay trong DevTools) bị bắt ở
`storage.js`, xóa khóa rồi trả về giá trị mặc định.

### Module 2 — đối chiếu tiêu chí "done"

| Tiêu chí | Hiện thực ở đâu |
| --- | --- |
| `products.filter(...).map(...)` viết trơn tay | `js/products.js`, `labs/module-2/day-1-array-methods/` |
| Giải thích được arrow function tránh lỗi `this` | `labs/module-2/day-1-this-arrow/` — 4 cách gọi + 4 cách sửa |
| `data.js` export và import được qua ES module | `js/data.js` + `labs/module-2/day-1-modules/` (4 file) |
| Trang sản phẩm render 100% từ JS | `index.html` không còn `.product-card` nào |
| Tìm kiếm lọc mượt khi gõ, có trạng thái rỗng | `js/home.js` — sự kiện `input` + `stateHTML()` |
| Một listener duy nhất cho mọi nút "Add to cart" | `js/home.js` — listener trên `#product-grid` |
| Sản phẩm load từ API thật, có loading + xử lý lỗi | `js/api.js` + skeleton trong `js/ui.js` |
| Trang chi tiết mở đúng sản phẩm theo `?id=` | `js/detail.js` |
| Giỏ hàng sống sót qua reload, tăng/giảm/xóa đúng | `js/cart.js` + `js/cart-page.js` |
| Badge khớp tổng số lượng | `updateCartBadge()`, chạy lại qua sự kiện `cart:change` |

Dark mode của module 1 chỉ là checkbox CSS nên quên lựa chọn mỗi lần đổi trang.
Module 2 giữ nguyên checkbox và CSS đó, JS chỉ làm thêm việc nhớ — đúng tinh thần
"tiến hóa, không làm lại".

## Ảnh sản phẩm

`v1-html/` dùng ảnh placeholder từ `picsum.photos`. `v2-js/` đã chuyển sang ảnh và
dữ liệu thật của [DummyJSON](https://dummyjson.com/docs/products); chỉ còn
`js/data.js` (dữ liệu dự phòng khi offline) là vẫn trỏ về `picsum.photos`.

## Tài liệu

Lộ trình gốc: `docs/S_Learn.mhtml` (bản lưu offline từ S*Learn).
