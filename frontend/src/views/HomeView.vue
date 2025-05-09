<template>
  <ResponsiveContainer>
    <div class="home-view">
      <h1>英语学习平台</h1>
      
      <div class="form-container">
        <div class="form-group level-selectors">
          <label>选择您的英语水平</label>
          <div class="cascader-container">
            <div class="cascader-trigger" @click="toggleMainMenu">
              <span>{{ getDisplayValue }}</span>
              <span class="arrow">▼</span>
            </div>

            <div 
              v-if="showMainMenu" 
              class="cascader-menu main-menu"
            >
              <div 
                v-for="level in educationLevels" 
                :key="level.value"
                class="cascader-menu-item"
                @mouseenter="showSubMenu(level.value)"
              >
                {{ level.label }}
                <span class="arrow">></span>
                <div 
                  v-if="showGradeMenu && selectedEducationLevel === level.value"
                  class="cascader-menu sub-menu"
                >
                  <div 
                    v-for="grade in availableGrades" 
                    :key="grade.value"
                    class="cascader-menu-item"
                    @click="selectGrade(grade.value)"
                  >
                    {{ grade.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>选择您感兴趣的领域（可多选）</label>
          <div class="interests-section">
            <div class="interests-grid">
              <label 
                v-for="interest in interests" 
                :key="interest"
                class="interest-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="interest" 
                  v-model="formData.interests"
                >
                <span class="checkbox-icon"></span>
                <span class="interest-label">{{ interest }}</span>
              </label>
            </div>
            
            <div class="custom-interest-section">
              <label class="interest-checkbox custom-interest">
                <input 
                  type="checkbox" 
                  v-model="showCustomInput"
                >
                <span class="checkbox-icon"></span>
                <span class="interest-label">其他</span>
              </label>
              <div v-if="showCustomInput" class="custom-input-wrapper">
                <input 
                  type="text"
                  v-model="customInterest"
                  placeholder="请输入其他兴趣"
                  @keyup.enter="addCustomInterest"
                  class="custom-input"
                >
                <button 
                  class="add-btn"
                  @click="addCustomInterest"
                  :disabled="!customInterest.trim()"
                >
                  添加
                </button>
              </div>
              <div class="selected-interests" v-if="formData.interests.length > 0">
                <div 
                  v-for="interest in formData.interests" 
                  :key="interest"
                  class="selected-interest"
                >
                  {{ interest }}
                  <span 
                    class="remove-interest"
                    @click="removeInterest(interest)"
                  >×</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>输入您想学习的单词</label>
          <div class="words-input-section">
            <div 
              v-for="(word, index) in formData.target_words" 
              :key="index"
              class="word-input-wrapper"
            >
              <input 
                type="text"
                v-model="formData.target_words[index]"
                :placeholder="`单词 ${index + 1}`"
                class="word-input"
              >
              <button 
                v-if="formData.target_words.length > 3"
                class="remove-word-btn"
                @click="removeWord(index)"
              >×</button>
            </div>
            <button 
              class="add-word-btn"
              @click="addWordInput"
            >
              + 添加更多单词
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button 
            class="submit-btn" 
            @click="startLearning"
            :disabled="loading"
          >
            {{ loading ? '正在创建会话...' : '开始学习' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  </ResponsiveContainer>
</template>

<script>
import { ref, onMounted } from 'vue';
import { articleApi } from '@/api/article'
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const educationLevels = [
  { value: 'primary', label: '小学' },
  { value: 'middle', label: '初中' },
  { value: 'high', label: '高中' },
  { value: 'college', label: '大学' }
]

const gradeLevels = {
  primary: [
    { value: 'grade1', label: '一年级' },
    { value: 'grade2', label: '二年级' },
    { value: 'grade3', label: '三年级' },
    { value: 'grade4', label: '四年级' },
    { value: 'grade5', label: '五年级' },
    { value: 'grade6', label: '六年级' }
  ],
  middle: [
    { value: 'grade7', label: '初一' },
    { value: 'grade8', label: '初二' },
    { value: 'grade9', label: '初三' }
  ],
  high: [
    { value: 'grade10', label: '高一' },
    { value: 'grade11', label: '高二' },
    { value: 'grade12', label: '高三' }
  ],
  college: [
    { value: 'cet4', label: '四级' },
    { value: 'cet6', label: '六级' },
    { value: 'postgraduate', label: '考研英语' },
    { value: 'ielts', label: '雅思' },
    { value: 'toefl', label: '托福' }
  ]
}

export default {
  name: 'HomeView',
  components: {
    ResponsiveContainer,
    LoadingSpinner
  },
  data() {
    return {
      educationLevels,
      gradeLevels,
      selectedEducationLevel: '',
      selectedGrade: '',
      showMainMenu: false,
      showGradeMenu: false,
      loading: false,
      error: '',
      showCustomInput: false,
      customInterest: '',
      interests: [
        '运动',
        '音乐',
        '科技',
        '旅行',
        '美食',
        '电影',
        '文学',
        '游戏'
      ],
      formData: {
        interests: [],
        target_words: ['', '', '']
      }
    }
  },
  computed: {
    availableGrades() {
      return this.selectedEducationLevel ? this.gradeLevels[this.selectedEducationLevel] : []
    },
    getEducationLevelLabel() {
      const level = this.educationLevels.find(l => l.value === this.selectedEducationLevel)
      return level ? level.label : ''
    },
    getGradeLabel() {
      const grade = this.availableGrades.find(g => g.value === this.selectedGrade)
      return grade ? grade.label : ''
    },
    getDisplayValue() {
      if (this.selectedEducationLevel && this.selectedGrade) {
        return `${this.getEducationLevelLabel}/${this.getGradeLabel}`
      }
      return '请选择'
    }
  },
  methods: {
    toggleMainMenu() {
      this.showMainMenu = !this.showMainMenu
      if (!this.showMainMenu) {
        this.showGradeMenu = false
      }
    },
    showSubMenu(level) {
      this.selectedEducationLevel = level
      this.showGradeMenu = true
    },
    selectGrade(grade) {
      this.selectedGrade = grade
      this.showMainMenu = false
      this.showGradeMenu = false
    },
    addCustomInterest() {
      if (this.customInterest.trim()) {
        if (!this.formData.interests.includes(this.customInterest)) {
          this.formData.interests.push(this.customInterest)
        }
        this.customInterest = ''
        this.showCustomInput = false
      }
    },
    removeInterest(interest) {
      const index = this.formData.interests.indexOf(interest)
      if (index !== -1) {
        this.formData.interests.splice(index, 1)
      }
    },
    addWordInput() {
      this.formData.target_words.push('')
    },
    removeWord(index) {
      this.formData.target_words.splice(index, 1)
    },
    async startLearning() {
      try {
        console.log('开始创建学习会话...')
        this.loading = true
        this.error = null

        // 验证表单
        if (!this.selectedEducationLevel || !this.selectedGrade || !this.formData.interests.length || !this.formData.target_words.length) {
          console.warn('表单验证失败:', {
            educationLevel: this.selectedEducationLevel,
            grade: this.selectedGrade,
            interests: this.formData.interests,
            targetWords: this.formData.target_words
          })
          this.error = '请填写所有必填项'
          return
        }

        // 构造会话数据
        const sessionData = {
          english_level: this.selectedEducationLevel + '/' + this.selectedGrade,
          interests: this.formData.interests,
          targetWords: this.formData.target_words.filter(word => word.trim())
        }
        console.log('准备发送的会话数据:', sessionData)

        // 创建会话并等待所有内容生成
        console.log('开始调用 createSession API...')
        const response = await articleApi.createSession(sessionData)
        console.log('createSession API 响应:', response)
        
        // 将数据存储到 localStorage，使用 response.id 作为 sessionId
        const storageData = {
          sessionId: response.id,
          article: response.article,
          quizQuestions: response.quizQuestions || []
        }
        console.log('准备存储到 localStorage 的数据:', storageData)
        localStorage.setItem('currentSession', JSON.stringify(storageData))
        
        // 跳转到文章页面，使用 response.id 作为 sessionId
        console.log('准备跳转到文章页面，sessionId:', response.id)
        this.$router.replace({
          name: 'article',
          query: { sessionId: response.id }
        })
      } catch (error) {
        console.error('创建会话失败:', error)
        this.error = '创建学习会话失败，请重试'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.form-container {
  background-color: white;
  padding: 2rem;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.8rem;
  color: var(--text-color);
  font-weight: 500;
}

.level-selectors {
  margin-bottom: 2.5rem;
}

.cascader-container {
  position: relative;
  display: inline-block;
  width: 200px;
}

.cascader-trigger {
  width: 100%;
  padding: 0.8rem 1rem;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 40px;
}

.cascader-trigger:hover {
  border-color: var(--primary-color);
}

.main-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  margin-top: 4px;
}

.sub-menu {
  position: absolute;
  left: 100%;
  top: 0;
  width: 200px;
  margin-left: 4px;
  z-index: 2;
}

.cascader-menu {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.cascader-menu-item {
  padding: 0.8rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.cascader-menu-item:last-child {
  border-bottom: none;
}

.main-menu .cascader-menu-item:hover {
  background-color: var(--background-color);
  color: var(--primary-color);
}

.main-menu .cascader-menu-item:hover .arrow {
  color: var(--primary-color);
}

.sub-menu .cascader-menu-item {
  color: var(--text-color);
}

.sub-menu .cascader-menu-item:hover {
  background-color: var(--background-color);
  color: var(--primary-color);
}

.arrow {
  color: var(--text-color-light);
  font-size: 0.8rem;
}

.interests-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.interest-checkbox {
  display: flex;
  align-items: center;
  padding: 0.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: transparent;
  width: auto;
}

.interest-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  width: 1.2rem;
  height: 1.2rem;
}

.checkbox-icon {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 0.5rem;
}

.interest-label {
  font-size: 0.9rem;
  color: var(--text-color);
  transition: color 0.2s ease;
  white-space: nowrap;
  line-height: 1.2rem;
  display: inline-block;
  vertical-align: middle;
}

.interest-checkbox input[type="checkbox"]:checked + .checkbox-icon {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.interest-checkbox input[type="checkbox"]:checked + .checkbox-icon::after {
  content: '✓';
  color: white;
  font-size: 0.8rem;
}

.interest-checkbox:hover .interest-label {
  color: var(--primary-color);
}

.custom-interest-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1rem;
}

.custom-interest {
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
}

.custom-input-wrapper {
  display: flex;
  gap: 0.8rem;
  margin-left: 1.7rem;
  width: calc(100% - 1.7rem);
  align-items: center;
}

.custom-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-width: 0;
}

.custom-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

.custom-input::placeholder {
  color: var(--text-color-light);
}

.add-btn {
  padding: 0.6rem 1.2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  white-space: nowrap;
  min-width: 80px;
}

.add-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.add-btn:active:not(:disabled) {
  transform: translateY(0);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--border-color);
}

.selected-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background-color: var(--background-color);
  border-radius: var(--border-radius-sm);
}

.selected-interest {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

.remove-interest {
  color: var(--text-color-light);
  cursor: pointer;
  transition: color 0.2s ease;
}

.remove-interest:hover {
  color: var(--error-color);
}

.words-input-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.word-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.word-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

.remove-word-btn {
  padding: 0.4rem 0.8rem;
  background-color: var(--error-bg);
  color: var(--error-color);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  line-height: 1;
}

.remove-word-btn:hover {
  background-color: var(--error-color);
  color: white;
}

.add-word-btn {
  padding: 0.8rem;
  background-color: var(--background-color);
  color: var(--primary-color);
  border: 1px dashed var(--primary-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  text-align: center;
  margin-top: 0.5rem;
}

.add-word-btn:hover {
  background-color: rgba(var(--primary-rgb), 0.05);
}

.form-actions {
  text-align: center;
  margin-top: 2rem;
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--border-radius-sm);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: var(--error-color);
  text-align: center;
  margin-top: 1rem;
  padding: 0.8rem;
  background-color: var(--error-bg);
  border-radius: var(--border-radius-sm);
}

.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.quiz-button-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.quiz-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius-sm);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

.quiz-button:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quiz-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.quiz-button.loading {
  background-color: var(--primary-color);
  cursor: wait;
}

.quiz-button .mr-2 {
  margin-right: 8px;
}

.quiz-container {
  margin-top: 40px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quiz-container h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }

  .cascader-container {
    width: 100%;
  }

  .main-menu {
    width: 100%;
  }

  .sub-menu {
    position: static;
    width: 100%;
    margin-left: 1rem;
    margin-top: 0.5rem;
  }

  .interests-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .custom-input-wrapper {
    margin-left: 1.7rem;
    gap: 0.5rem;
  }

  .add-btn {
    padding: 0.6rem 1rem;
    min-width: 60px;
  }

  .word-input-wrapper {
    flex-direction: column;
    gap: 0.3rem;
  }

  .remove-word-btn {
    width: 100%;
    padding: 0.4rem;
  }
}
</style>
