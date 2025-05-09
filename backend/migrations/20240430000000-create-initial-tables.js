'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create learning_sessions table
    await queryInterface.createTable('learning_sessions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      english_level: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create session_interests table
    await queryInterface.createTable('session_interests', {
      session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'learning_sessions',
          key: 'id'
        }
      },
      interest: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });

    // Create articles table
    await queryInterface.createTable('articles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'learning_sessions',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      english_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      chinese_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      article_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      expired_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create target_words table
    await queryInterface.createTable('target_words', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'learning_sessions',
          key: 'id'
        }
      },
      word: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phonetic: {
        type: Sequelize.STRING,
        allowNull: true
      },
      chinese_meaning: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      usage_example: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Create quiz_questions table
    await queryInterface.createTable('quiz_questions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'learning_sessions',
          key: 'id'
        }
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      correct_answer_index: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      question_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      explanation: {
        type: Sequelize.STRING(1000),
        allowNull: true
      }
    });

    // Create quiz_question_options table
    await queryInterface.createTable('quiz_question_options', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      question_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'quiz_questions',
          key: 'id'
        }
      },
      option_text: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      option_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 禁用外键检查
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('quiz_question_options');
    await queryInterface.dropTable('quiz_questions');
    await queryInterface.dropTable('target_words');
    await queryInterface.dropTable('articles');
    await queryInterface.dropTable('session_interests');
    await queryInterface.dropTable('learning_sessions');

    // 启用外键检查
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}; 