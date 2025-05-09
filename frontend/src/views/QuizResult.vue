<template>
  <ResponsiveContainer>
    <div class="result-page">
      <h1>测试结果</h1>
      
      <div class="score-summary">
        <div class="total-score">
          总分：{{ score }}/{{ totalQuestions }}
        </div>
      </div>

      <div class="question-results">
        <div v-for="(result, index) in results" :key="index" class="question-result">
          <div class="question-header">
            <span class="question-number">第{{ index + 1 }}题</span>
            <span class="question-type">{{ getQuestionType(result.question_type) }}</span>
            <span class="result-status" :class="{ correct: result.is_correct, incorrect: !result.is_correct }">
              {{ result.is_correct ? '正确' : '错误' }}
            </span>
          </div>
          <div class="question-content">
            <p class="question-text">{{ result.question }}</p>
            <div class="answer-section">
              <p>你的答案：{{ result.selected_option }}</p>
              <p>正确答案：{{ result.correct_option }}</p>
            </div>
            <div class="explanation" v-if="result.explanation">
              <p>解析：{{ result.explanation }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="restart-btn" @click="restartQuiz">重新开始</button>
      </div>
    </div>
  </ResponsiveContainer>
</template>

<script>
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'

export default {
  name: 'QuizResult',
  components: {
    ResponsiveContainer
  },
  data() {
    return {
      results: [],
      questions: []
    }
  },
  created() {
    const { results, questions } = this.$route.query
    if (results && questions) {
      this.results = JSON.parse(results)
      this.questions = JSON.parse(questions)
    }
  },
  computed: {
    score() {
      return this.results.filter(r => r.is_correct).length
    },
    totalQuestions() {
      return this.questions.length
    }
  },
  methods: {
    getQuestionType(type) {
      const types = {
        VOCABULARY: '词汇题',
        COMPREHENSION: '理解题',
        GRAMMAR: '语法题'
      }
      return types[type] || type
    },
    restartQuiz() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.result-page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

h1 {
  text-align: center;
  color: var(--secondary-color);
  margin-bottom: var(--spacing-xl);
  font-size: 1.5rem;
}

.score-summary {
  background-color: var(--white);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.total-score {
  text-align: center;
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
}

.question-results {
  display: grid;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.question-result {
  background-color: var(--white);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.question-number {
  font-weight: 500;
  color: var(--text-color);
}

.question-type {
  color: var(--primary-color);
}

.result-status {
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

.result-status.correct {
  background-color: var(--success-light);
  color: var(--success-color);
}

.result-status.incorrect {
  background-color: var(--error-light);
  color: var(--error-color);
}

.question-content {
  display: grid;
  gap: var(--spacing-lg);
}

.question-text {
  font-weight: 500;
  color: var(--text-color);
}

.answer-section {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--background-color);
  border-radius: var(--border-radius-sm);
}

.explanation {
  padding: var(--spacing-lg);
  background-color: var(--background-color);
  border-radius: var(--border-radius-sm);
}

.actions {
  text-align: center;
}

.restart-btn {
  background-color: var(--primary-color);
  color: var(--white);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.restart-btn:hover {
  background-color: var(--primary-dark);
}

@media (max-width: 768px) {
  .result-page {
    padding: var(--spacing-md);
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .result-status {
    margin-left: 0;
  }

  .question-result {
    padding: var(--spacing-lg);
  }
}
</style> 