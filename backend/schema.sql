-- 如果数据库存在则删除
DROP DATABASE IF EXISTS english_learning;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS english_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE english_learning;

-- 学习会话表
CREATE TABLE learning_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    english_level VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL
);

-- 兴趣表
CREATE TABLE session_interests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    interest VARCHAR(255) NOT NULL,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 目标单词表
CREATE TABLE target_words (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    word VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    chinese_meaning TEXT,
    usage_example TEXT,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 文章表
CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    english_text TEXT NOT NULL,
    chinese_text TEXT NOT NULL,
    article_order INT NOT NULL,
    expired_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 测验题表
CREATE TABLE quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    correct_answer_index INT NOT NULL,
    explanation TEXT,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id)
);

-- 测验选项表
CREATE TABLE quiz_question_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
); 