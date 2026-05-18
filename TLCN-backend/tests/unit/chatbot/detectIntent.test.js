const { detectIntent } = require("../../../controllers/chatController");

describe("detectIntent", () => {
  test.each([
    [
      "compare",
      "So sánh MacBook Air M2 và Dell XPS 13 giúp tôi, máy nào đáng mua hơn?",
    ],
    [
      "compare",
      "Laptop gaming Asus TUF khác gì so với MSI Katana vậy shop?",
    ],
    [
      "consult",
      "Mình là sinh viên công nghệ thông tin, cần laptop khoảng 20 triệu để lập trình.",
    ],
    [
      "consult",
      "Tư vấn giúp mình một laptop mỏng nhẹ dùng văn phòng và họp online.",
    ],
    [
      "order",
      "Cho tôi kiểm tra trạng thái đơn hàng vừa mua hôm qua được không?",
    ],
    [
      "order",
      "Đơn của tôi giao đến đâu rồi shop?",
    ],
    [
      "policy",
      "Shop có chính sách bảo hành laptop như thế nào?",
    ],
    [
      "policy",
      "Nếu máy bị lỗi thì đổi trả trong bao lâu và có hoàn tiền không?",
    ],
    [
      "unknown",
      "Hôm nay thời tiết thế nào?",
    ],
  ])("returns %s for Vietnamese message: %s", (expectedIntent, message) => {
    expect(detectIntent(message)).toBe(expectedIntent);
  });
});