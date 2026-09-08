-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 03, 2026 at 11:45 AM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202700`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`, `description`, `created_at`) VALUES
(1, 'Electronics', 'Electronic devices and accessories', '2026-08-08 08:01:56'),
(2, 'Clothing', 'Apparel and fashion items', '2026-08-08 08:01:56'),
(3, 'Food & Bev', 'Food and beverage products', '2026-08-08 08:01:56'),
(4, 'Tools', 'Hardware tools and equipment', '2026-08-08 08:01:56');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int NOT NULL,
  `sku` varchar(50) NOT NULL COMMENT 'Stock Keeping Unit / Barcode',
  `name` varchar(255) NOT NULL COMMENT 'Product name',
  `category_id` int DEFAULT NULL COMMENT 'ID category',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Product unit price',
  `quantity` int NOT NULL DEFAULT '0' COMMENT 'Stock quantity',
  `status` enum('active','inactive','out_of_stock') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image` text,
  `supplier` varchar(255) DEFAULT NULL,
  `min_quantity` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `sku`, `name`, `category_id`, `price`, `quantity`, `status`, `created_at`, `updated_at`, `image`, `supplier`, `min_quantity`) VALUES
(1, 'APP-AIR-P2', 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)', 1, 249.00, 1, 'active', '2026-07-27 10:30:17', '2026-08-28 14:18:12', 'https://www.apple.com/newsroom/images/2023/09/apple-introduces-new-airpods-pro-2nd-generation/article/Apple-AirPods-Pro-2nd-generation-USB-C-connection-230912_inline.jpg.large_2x.jpg', 'Apple', 0);

-- --------------------------------------------------------

--
-- Table structure for table `product_stores`
--

CREATE TABLE `product_stores` (
  `product_id` int NOT NULL,
  `store_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_stores`
--

INSERT INTO `product_stores` (`product_id`, `store_id`, `quantity`) VALUES
(1, 1, 1),
(2, 1, 22),
(3, 1, 8),
(4, 1, 14),
(5, 1, 40),
(5, 2, 2),
(6, 1, 18),
(7, 1, 22),
(8, 1, 16),
(9, 1, 35),
(10, 1, 40),
(11, 1, 30),
(12, 1, 9),
(13, 1, 20),
(14, 1, 5),
(15, 1, 16),
(19, 2, 1),
(19, 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `movement_id` int NOT NULL,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('in','out','adjust') NOT NULL COMMENT 'in = receiving, out = dispatching, adjust = inventory adjustment',
  `quantity` int NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`movement_id`, `product_id`, `user_id`, `type`, `quantity`, `note`, `created_at`) VALUES
(1, 1, 1, 'in', 3, NULL, '2026-08-28 14:06:05'),
(2, 1, 1, 'in', 1, NULL, '2026-08-28 14:12:49'),
(3, 1, 1, 'out', 18, NULL, '2026-08-28 14:18:12'),
(4, 5, 1, 'out', 3, NULL, '2026-08-28 14:44:54'),
(5, 19, 1, 'in', 2, NULL, '2026-09-02 18:31:56'),
(6, 19, 1, 'out', 2, NULL, '2026-09-03 04:08:23');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `store_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Operational',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`store_id`, `name`, `type`, `address`, `manager`, `phone`, `status`, `created_at`) VALUES
(1, 'Main Warehouse - Bangkok', 'Warehouse', '123 Sukhumvit Rd, Khlong Toei, Bangkok 10110', 'Sarah Wilson', '+66 2 123 4567', 'Operational', '2026-08-27 05:03:18'),
(2, 'Retail Outlet - Siam Paragon', 'Retail Store', '991 Rama I Rd, Pathum Wan, Bangkok 10330', 'John Davis', '+66 2 987 6543', 'Operational', '2026-08-27 05:03:18'),
(3, 'Fulfillment Center - Samut Prakan', 'Fulfillment', '456 Bangna-Trad Rd, Bang Phli, Samut Prakan 10540', 'Michael Chen', '+66 2 444 8888', 'Restocking', '2026-08-27 05:03:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$6ttrf.WVa/HDxWckecG4Ge3LZIaXtJhNS3Mit4fF9xeL7XVrBvUJy', 'admin', '2026-08-26 18:26:20'),
(2, 'user01', 'user01@example.com', '$2b$10$NzHEA3tg7OnWQ3in0gc4POsunlFBHbbiLaXJXTRaF.n2wQYpLTzv.', 'user', '2026-08-26 20:52:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `sku` (`sku`);

--
-- Indexes for table `product_stores`
--
ALTER TABLE `product_stores`
  ADD PRIMARY KEY (`product_id`,`store_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`movement_id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `movement_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `store_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
