-- =============================================================================
-- IP800 Internet Programming — งานกลุ่ม K-Means Grouping Stock Data
-- ตารางกลางสำหรับรวม product ของทุกคนในกลุ่ม
-- Database: ip_std6730202700   |   MySQL 8.x
-- =============================================================================
-- รูปแบบ JSON ที่ทุกคนต้องส่งออกให้เหมือนกัน:
--   { "id": 1, "name": "Product Name", "category": "Electronics",
--     "price": 100, "stock": 50, "sold": 50, "image": "image.jpg" }
-- =============================================================================


-- -----------------------------------------------------------------------------
-- ส่วนที่ 1: VIEW แปลงตาราง products ของเราเองให้ออกมาตรงรูปแบบกลาง
--            ใช้เป็น source ของ endpoint /api/products
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_shared_products`;

CREATE VIEW `v_shared_products` AS
SELECT
    p.`product_id`                              AS `id`,
    p.`name`                                    AS `name`,
    COALESCE(c.`category_name`, 'Uncategorized') AS `category`,
    CAST(p.`price` AS DECIMAL(10,2))            AS `price`,
    p.`quantity`                                AS `stock`,
    COALESCE((
        SELECT SUM(sm.`quantity`)
        FROM `stock_movements` sm
        WHERE sm.`product_id` = p.`product_id`
          AND sm.`type` = 'out'
    ), 0)                                       AS `sold`,
    COALESCE(p.`image`, '')                     AS `image`
FROM `products` p
LEFT JOIN `categories` c ON c.`category_id` = p.`category_id`
WHERE p.`status` <> 'inactive';

-- ทดสอบ:  SELECT * FROM v_shared_products;


-- -----------------------------------------------------------------------------
-- ส่วนที่ 2: ตารางกลาง เก็บ product ของทุกคนในกลุ่มรวมกัน
--            (คนที่ทำ aggregator เป็นคนสร้างตารางนี้ในเครื่องตัวเอง)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `group_products`;

CREATE TABLE `group_products` (
    `row_id`     INT           NOT NULL AUTO_INCREMENT COMMENT 'PK ของตารางรวม',
    `owner`      VARCHAR(20)   NOT NULL                COMMENT 'รหัสนักศึกษาเจ้าของข้อมูล',
    `id`         INT           NOT NULL                COMMENT 'product id ฝั่งเจ้าของ (ซ้ำข้ามคนได้)',
    `name`       VARCHAR(255)  NOT NULL,
    `category`   VARCHAR(100)  NOT NULL DEFAULT 'Uncategorized',
    `price`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `stock`      INT           NOT NULL DEFAULT 0,
    `sold`       INT           NOT NULL DEFAULT 0,
    `image`      TEXT,
    `cluster`    INT           DEFAULT NULL            COMMENT 'ผลลัพธ์จาก K-Means (เติมทีหลัง)',
    `fetched_at` TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`row_id`),
    UNIQUE KEY `uk_owner_product` (`owner`, `id`),
    KEY `idx_category` (`category`),
    KEY `idx_price`    (`price`),
    KEY `idx_cluster`  (`cluster`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -----------------------------------------------------------------------------
-- ส่วนที่ 3: โหลดข้อมูลของเราเองเข้าตารางรวม
--            (เปลี่ยน '6730202700' เป็นรหัสนักศึกษาของคุณ)
-- -----------------------------------------------------------------------------
INSERT INTO `group_products` (`owner`, `id`, `name`, `category`, `price`, `stock`, `sold`, `image`)
SELECT '6730202700', `id`, `name`, `category`, `price`, `stock`, `sold`, `image`
FROM `v_shared_products`
ON DUPLICATE KEY UPDATE
    `name`     = VALUES(`name`),
    `category` = VALUES(`category`),
    `price`    = VALUES(`price`),
    `stock`    = VALUES(`stock`),
    `sold`     = VALUES(`sold`),
    `image`    = VALUES(`image`);


-- -----------------------------------------------------------------------------
-- ส่วนที่ 4: ใส่ข้อมูลของเพื่อน — รูปแบบ INSERT ที่ให้เพื่อนส่งมา
-- -----------------------------------------------------------------------------
INSERT INTO `group_products` (`owner`, `id`, `name`, `category`, `price`, `stock`, `sold`, `image`) VALUES
('6730202701', 1, 'Logitech MX Master 3S', 'Electronics',  99.00,  25,  40, 'mx3s.jpg'),
('6730202701', 2, 'Anker 737 Power Bank',  'Electronics', 149.00,  12,  18, 'anker737.jpg'),
('6730202702', 1, 'Uniqlo AIRism T-Shirt',  'Clothing',     14.90, 200, 320, 'airism.jpg')
ON DUPLICATE KEY UPDATE
    `name`     = VALUES(`name`),
    `category` = VALUES(`category`),
    `price`    = VALUES(`price`),
    `stock`    = VALUES(`stock`),
    `sold`     = VALUES(`sold`),
    `image`    = VALUES(`image`);


-- -----------------------------------------------------------------------------
-- ส่วนที่ 5: คิวรีที่ใช้บ่อย
-- -----------------------------------------------------------------------------

-- 5.1 ดึง dataset ให้ clustering.py (feature = price, stock, sold)
SELECT `owner`, `id`, `name`, `category`, `price`, `stock`, `sold`
FROM `group_products`
ORDER BY `owner`, `id`;

-- 5.2 เช็กว่าได้ข้อมูลจากใครมาแล้วบ้าง กี่แถว
SELECT `owner`, COUNT(*) AS `rows`, MIN(`price`) AS `min_price`, MAX(`price`) AS `max_price`
FROM `group_products`
GROUP BY `owner`;

-- 5.3 หลังรัน K-Means แล้ว เขียนผลกลับ (ตัวอย่าง)
-- UPDATE `group_products` SET `cluster` = 0 WHERE `owner` = '6730202700' AND `id` = 1;

-- 5.4 สรุปลักษณะแต่ละ cluster สำหรับใส่ในรายงาน (สไลด์หน้า 10)
SELECT
    `cluster`,
    COUNT(*)            AS `n_products`,
    ROUND(AVG(`price`), 2) AS `avg_price`,
    MIN(`price`)        AS `min_price`,
    MAX(`price`)        AS `max_price`,
    ROUND(AVG(`stock`), 1) AS `avg_stock`,
    ROUND(AVG(`sold`), 1)  AS `avg_sold`
FROM `group_products`
WHERE `cluster` IS NOT NULL
GROUP BY `cluster`
ORDER BY `avg_price`;

-- 5.5 ให้ MySQL คืนออกมาเป็น JSON ตรงรูปแบบกลางเลย
SELECT JSON_ARRAYAGG(JSON_OBJECT(
    'id',       `id`,
    'name',     `name`,
    'category', `category`,
    'price',    CAST(`price` AS DOUBLE),
    'stock',    `stock`,
    'sold',     `sold`,
    'image',    `image`
)) AS `products_json`
FROM `group_products`;
