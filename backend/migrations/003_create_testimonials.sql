CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

