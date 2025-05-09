<template>
  <ResponsiveContainer>
    <div class="quiz-page">
      <div class="quiz-header">
        <h1>测试题</h1>
        <div class="progress">
          <span class="current">{{ currentQuestionIndex + 1 }}</span>
          <span class="total">/ {{ questions.length }}</span>
        </div>
      </div>

      <div class="question-container" v-if="currentQuestion">
        <div class="question">
          <div class="question-type">
            {{ getQuestionType(currentQuestion.question_type) }}
          </div>
          <h2>{{ currentQuestion.question }}</h2>
          <div class="options">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option"
              :class="{
                'selected': selectedAnswer === index,
                'correct': showAnswer && index === currentQuestion.correct_answer_index,
                'incorrect': showAnswer && selectedAnswer === index && index !== currentQuestion.correct_answer_index
              }"
              @click="selectAnswer(index)"
              :disabled="showAnswer"
            >
              {{ option }}
            </button>
          </div>
          <div class="explanation" v-if="showAnswer">
            <div class="explanation-header">
              <i class="fas fa-info-circle"></i>
              <span>解析</span>
            </div>
            <p>{{ currentQuestion.explanation }}</p>
          </div>
        </div>

        <div class="navigation">
          <button
            class="prev-btn"
            @click="prevQuestion"
            :disabled="currentQuestionIndex === 0"
          >
            <i class="fas fa-arrow-left"></i> 上一题
          </button>
          <button
            class="next-btn"
            @click="nextQuestion"
            :disabled="!showAnswer && currentQuestionIndex === questions.length - 1"
          >
            {{ currentQuestionIndex === questions.length - 1 ? '完成' : '下一题' }}
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <div class="result" v-if="showResult">
        <h2>测试结果</h2>
        <div class="score">
          得分：{{ score }}/{{ questions.length }}
        </div>
        <div class="score-details">
          <div class="score-item">
            <span class="label">词汇题：</span>
            <span class="value">{{ getScoreByType('VOCABULARY') }}/5</span>
          </div>
          <div class="score-item">
            <span class="label">理解题：</span>
            <span class="value">{{ getScoreByType('COMPREHENSION') }}/3</span>
          </div>
          <div class="score-item">
            <span class="label">语法题：</span>
            <span class="value">{{ getScoreByType('GRAMMAR') }}/2</span>
          </div>
        </div>
        <button class="restart-btn" @click="restartQuiz">
          重新开始
        </button>
      </div>

      <div v-if="questions.length > 0">
        <!-- 现有的测验内容 -->
      </div>
      <div v-else-if="error">
        <ErrorMessage
          :message="error"
          retry
          @retry="fetchQuiz"
        />
      </div>
      <div v-else>
        <LoadingSpinner message="加载测试题中..." />
      </div>
    </div>
  </ResponsiveContainer>
</template>

<script>
import { articleApi } from '@/api/article'
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorMessage from '@/components/ErrorMessage.vue'

export default {
  name: 'QuizPage',
  components: {
    ResponsiveContainer,
    LoadingSpinner,
    ErrorMessage
  },
  props: {
    sessionId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      questions: [],
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showAnswer: false,
      showResult: false,
      loading: true,
      error: '',
      results: []
    }
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentQuestionIndex]
    },
    score() {
      return this.results.filter(r => r.is_correct).length
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
    getScoreByType(type) {
      return this.results.filter(r => {
        const question = this.questions.find(q => q.id === r.question_id)
        return question?.question_type === type && r.is_correct
      }).length
    },
    async fetchQuiz(sessionId) {
      console.log('开始获取测试题，sessionId:', sessionId)
      try {
        this.loading = true
        this.error = ''
        const response = await articleApi.getQuizQuestions(sessionId)
        console.log('获取到的测试题:', response)
        this.questions = response
      } catch (err) {
        console.error('获取测试题失败:', err)
        this.error = '获取测试题失败，请重试'
      } finally {
        this.loading = false
      }
    },
    selectAnswer(index) {
      if (this.showAnswer) return
      this.selectedAnswer = index
      this.showAnswer = true
      this.results.push({
        question_id: this.currentQuestion.id,
        selected_answer: index,
        is_correct: index === this.currentQuestion.correct_answer_index
      })
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++
        this.selectedAnswer = null
        this.showAnswer = false
      } else {
        const quizResults = this.results.map(result => {
          const question = this.questions.find(q => q.id === result.question_id)
          return {
            ...result,
            question: question.question,
            question_type: question.question_type,
            selected_option: question.options[result.selected_answer],
            correct_option: question.options[question.correct_answer_index],
            explanation: question.explanation
          }
        })
        
        this.$router.push({
          name: 'result',
          params: { sessionId: this.sessionId },
          query: {
            results: JSON.stringify(quizResults),
            questions: JSON.stringify(this.questions)
          }
        })
      }
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
        this.selectedAnswer = null
        this.showAnswer = false
      }
    },
    restartQuiz() {
      this.currentQuestionIndex = 0
      this.selectedAnswer = null
      this.showAnswer = false
      this.showResult = false
      this.results = []
      this.fetchQuiz()
    }
  },
  mounted() {
    console.log('QuizPage mounted 钩子开始执行')
    // 从路由参数获取 sessionId
    const sessionId = this.$route.params.sessionId
    console.log('从路由参数获取的 sessionId:', sessionId)
    
    // 如果路由参数中没有 sessionId，尝试从 localStorage 获取
    if (!sessionId) {
      console.log('路由参数中没有 sessionId，尝试从 localStorage 获取')
      const sessionData = localStorage.getItem('currentSession')
      console.log('从 localStorage 获取的会话数据:', sessionData)
      
      if (sessionData) {
        const { sessionId: storedSessionId, quizQuestions } = JSON.parse(sessionData)
        console.log('解析后的会话数据:', {
          storedSessionId,
          hasQuizQuestions: !!quizQuestions
        })
        
        if (storedSessionId) {
          // 如果本地存储中有测试题，直接使用
          if (quizQuestions && quizQuestions.length > 0) {
            console.log('使用本地存储的测试题')
            this.questions = quizQuestions
            this.loading = false
            return
          }
          // 否则从服务器获取
          console.log('从服务器获取测试题，sessionId:', storedSessionId)
          this.fetchQuiz(storedSessionId)
          return
        }
      }
      console.error('无法获取有效的 sessionId')
      this.error = '无法获取会话ID，请重新开始学习'
      return
    }
    
    // 从服务器获取测试题
    console.log('从服务器获取测试题，sessionId:', sessionId)
    this.fetchQuiz(sessionId)
  }
}
</script>

<style scoped>
.quiz-page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  background-color: var(--white);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}

h1 {
  color: var(--text-color);
  margin: 0;
  font-size: 1.5rem;
}

.progress {
  font-size: 1.2rem;
}

.current {
  color: var(--primary-color);
  font-weight: bold;
}

.total {
  color: var(--text-light);
}

.question-container {
  background-color: var(--white);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-xl);
}

.question {
  margin-bottom: var(--spacing-xl);
}

.question-type {
  display: inline-block;
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-lg);
  font-size: 0.9rem;
}

h2 {
  color: var(--text-color);
  margin-bottom: var(--spacing-lg);
  line-height: 1.4;
  font-size: 1.25rem;
}

.options {
  display: grid;
  gap: var(--spacing-md);
}

.option {
  width: 100%;
  padding: var(--spacing-lg);
  text-align: left;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.option:hover:not(:disabled) {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
}

.option.selected {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--white);
}

.option.correct {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: var(--white);
}

.option.incorrect {
  background-color: var(--error-color);
  border-color: var(--error-color);
  color: var(--white);
}

.option:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.explanation {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--background-color);
  border-radius: var(--border-radius-sm);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-color);
  margin-bottom: var(--spacing-sm);
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-xl);
}

.prev-btn,
.next-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.prev-btn {
  background-color: var(--background-color);
  color: var(--text-color);
}

.next-btn {
  background-color: var(--primary-color);
  color: var(--white);
}

.prev-btn:hover:not(:disabled) {
  background-color: var(--border-color);
}

.next-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.prev-btn:disabled,
.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--white);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}

.score {
  font-size: 2rem;
  color: var(--primary-color);
  margin: var(--spacing-lg) 0;
}

.score-details {
  margin: var(--spacing-xl) 0;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.score-item:last-child {
  border-bottom: none;
}

.label {
  color: var(--text-light);
}

.value {
  color: var(--text-color);
  font-weight: 500;
}

.restart-btn {
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  padding: var(--spacing-md) var(--spacing-2xl);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.restart-btn:hover {
  background-color: var(--primary-dark);
}

@media (max-width: 640px) {
  .quiz-page {
    padding: var(--spacing-md);
  }

  .quiz-header {
    padding: var(--spacing-md);
  }

  .question-container {
    padding: var(--spacing-lg);
  }

  .option {
    padding: var(--spacing-md);
  }

  .prev-btn,
  .next-btn {
    padding: var(--spacing-sm) var(--spacing-lg);
  }
}
</style> 