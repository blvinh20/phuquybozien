-- Clear existing activities
DELETE FROM activities;

-- Day 1: TP.HCM - PHÚ QUÝ (Thứ Sáu 15/05)
INSERT INTO activities (day, time, period, title, location, description, image_url, location_url) VALUES
(1, '05:00', 'Sáng', 'Khởi hành từ Sài Gòn', 'Bến tàu Phú Quý', 'Xuất phát từ Cảng Cát Linh hoặc Hàm Luông. Mang theo bánh/nước.', 'https://images.unsplash.com/photo-1559827260-dc66d51bef36?q=80&w=1000&auto=format&fit=crop', 'https://maps.google.com/?q=Phu+Quy+Island'),
(1, '07:30', 'Sáng', 'Đặt chân lên đảo', 'Cảng Phú Quý', 'Check-in đảo. Chụp ảnh kỷ niệm.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop'),
(1, '08:00', 'Sáng', 'Di chuyển về homestay', 'Hòn Đất', 'Ra xe máy/ô tô về homestay. Nhận phòng, nghỉ ngơi.', 'https://images.unsplash.com/photo-1582719508461-72c7567b392e?q=80&w=1000&auto=format&fit=crop'),
(1, '10:00', 'Sáng', 'Khám phá làng chài', 'Làng Long Hải', 'Dạo quanh làng chài, ngắm tàu cá. Mua hải sản tươi sống.', 'https://images.unsplash.com/photo-1534430480872-6ce873a0e562?q=80&w=1000&auto=format&fit=crop'),
(1, '12:00', 'Trưa', 'Ăn trưa hải sản', 'Bãi Đá - Đường Lạch', 'Chi phí: 80k-120k/ng. Đặc sản: Cá hồng, tôm, mực.', 'https://images.unsplash.com/photo-1559847844-8918f8e9e4e8?q=80&w=1000&auto=format&fit=crop'),
(1, '14:00', 'Chiều', 'Tắm biển & Check-in', 'Bãi Nhỏ / Bãi Lớn', 'Tắm biển, chụp ảnh. Có thể thuê đồ lặn.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop'),
(1, '17:00', 'Chiều', 'Ngắm hoàng hôn', 'Mũi Đá Dái', 'View hoàng hôn đẹp nhất đảo. Tự chuẩn bị nước.', 'https://images.unsplash.com/photo-1506905925346-21bda4d40df9?q=80&w=1000&auto=format&fit=crop'),
(1, '19:00', 'Tối', 'BBQ/Pizza party', 'Homestay / Beach bar', 'Mua đồ nướng, tổ chức party tại bãi biển.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop'),
(1, '22:00', 'Tối', 'Cắm trại / Ngắm sao', 'Bãi biển gần homestay', 'Cắm trại trên bãi biển, ngắm sao trời.', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop');

-- Day 2: KHÁM PHÁ ĐẢO (Thứ Bảy 16/05)
INSERT INTO activities (day, time, period, title, location, description, image_url, location_url) VALUES
(2, '05:30', 'Sáng', 'Ngắm bình minh', 'Mũi Đá Dái / Lưng Rùa', 'Dậy sớm ngắm bình minh trên đảo.', 'https://images.unsplash.com/photo-1507400492013-162705f1c2a2?q=80&w=1000&auto=format&fit=crop'),
(2, '07:30', 'Sáng', 'Ăn sáng', 'Quán làng', 'Chi phí: 40k-60k/ng. Bánh mì, mì tôm.', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1000&auto=format&fit=crop'),
(2, '09:00', 'Sáng', 'Leo núi Dinh Chùa', 'Núi Dinh - Chùa Cầu', 'Leo núi Dinh (300m). Tham quan chùa cầu, cầu may mắn.', 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?q=80&w=1000&auto=format&fit=crop'),
(2, '11:30', 'Sáng', 'Tắm biển tự do', 'Bãi Đá Trắng', 'Bãi biển đẹp, ít người. Check-in rocks.', 'https://images.unsplash.com/photo-1519046904884-53125bff0583?q=80&w=1000&auto=format&fit=crop'),
(2, '12:30', 'Trưa', 'Ăn trưa', 'Khu vực cảng', 'Chi phí: 80k-100k/ng. Hải sản, cơm chiên.', 'https://images.unsplash.com/photo-1567129937968-cdad8f0d5a3a?q=80&w=1000&auto=format&fit=crop'),
(2, '14:00', 'Chiều', 'Lặn ngắm san hô', 'Bãi Đá Trắng / Hòn Đất', 'Thuê đồ lặn (50k-80k/ngày). Ngắm san hô, cá đẹp.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop'),
(2, '16:30', 'Chiều', 'Mát xa cá/dưỡng da', 'Homestay / Spa nhỏ', 'Mát xa cá chườm hoặc tắm nước ngọt.', 'https://images.unsplash.com/photo-1544161515-4ab6d45a8d3d?q=80&w=1000&auto=format&fit=crop'),
(2, '19:00', 'Tối', 'Party tối nay</', 'Beach bar / Homestay', 'Tổ chức party đêm cuối. Hát karaoke, nhảy dance.', 'https://images.unsplash.com/photo-1514525253344-f814d074358a?q=80&w=1000&auto=format&fit=crop'),
(2, '23:00', 'Tối', 'Đêm cuối đảo', 'Homestay', 'Tán gẫu, uống trà, kể chuyện.', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop');

-- Day 3: TIỄN BIỆT (Chủ Nhật 17/05)
INSERT INTO activities (day, time, period, title, location, description, image_url, location_url) VALUES
(3, '07:00', 'Sáng', 'Ăn sáng & Check-out', 'Homestay', 'Trả phòng, thu dọn đồ, trả xe máy.', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1000&auto=format&fit=crop'),
(3, '08:30', 'Sáng', 'Mua quà lưu niệm', 'Khu vực cảng / Chợ làng', 'Mua đặc sản: Khô cá dứa,干̛ng, bánh pía.', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000&auto=format&fit=crop'),
(3, '09:30', 'Sáng', 'Check-in lần cuối', 'Cảng Phú Quý', 'Chụp ảnh kỷ niệm tại cảng.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop'),
(3, '10:00', 'Sáng', 'Rời đảo', 'Tàu cao tốc', 'Lên tàu về đất liền.', 'https://images.unsplash.com/photo-1559827260-dc66d51bef36?q=80&w=1000&auto=format&fit=crop'),
(3, '12:00', 'Trưa', 'Ăn trưa trên tàu / Cảng', 'Cảng Hàm Luông / Cát Linh', 'Ăn trưa tại cảng trước khi về SG.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop'),
(3, '14:00', 'Chiều', 'Về tới Sài Gòn', 'TP.HCM', 'Kết thúc hành trình. Chia tay nhóm.', 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=1000&auto=format&fit=crop');