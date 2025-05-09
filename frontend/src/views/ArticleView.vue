<template>
  <ResponsiveContainer>
    <div class="article-view">
      <div class="article-container" v-if="article">
        <div class="article-header">
          <h1>{{ article.title }}</h1>
          <div class="article-actions">
            <div class="rewrite-dropdown">
              <button class="rewrite-btn" @click="toggleRewriteMenu">
                改写文章
                <span class="arrow-down">▼</span>
              </button>
              <div v-if="showRewriteMenu" class="rewrite-menu">
                <button @click="rewriteArticle('increase')">提高难度</button>
                <button @click="rewriteArticle('decrease')">降低难度</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="article-content">
          <div class="text-content">
            <div class="english-text">
              <h2>英文</h2>
              <div v-html="formattedEnglishText"></div>
            </div>
            
            <div class="chinese-text">
              <h2>中文</h2>
              <p v-if="article && article.chineseText">{{ article.chineseText }}</p>
            </div>
          </div>

          <div class="article-image" v-if="article.imageUrl && !imageError">
            <div v-if="imageLoading" class="image-loading">
              <LoadingSpinner />
            </div>
            <img 
              :src="article.imageUrl" 
              :alt="article.title" 
              @error="handleImageError"
              @load="handleImageLoad"
              v-show="!imageLoading"
              style="max-width: 100%; height: auto;"
            />
          </div>
        </div>

        <div class="action-buttons">
          <button class="start-quiz-btn" @click="startQuiz">开始测试</button>
        </div>
      </div>
      
      <div v-else-if="loading" class="loading">
        <LoadingSpinner message="正在加载文章..." />
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <!-- 单词悬浮提示框 -->
      <div v-if="tooltip && tooltip.visible" 
           class="word-tooltip"
           :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }">
        <div class="tooltip-content">
          <div class="word">{{ tooltip.word }}</div>
          <div v-if="tooltip.phonetic" class="phonetic">{{ tooltip.phonetic }}</div>
          <div v-if="tooltip.meaning" class="meaning">{{ tooltip.meaning }}</div>
          <div v-if="tooltip.example" class="example">{{ tooltip.example }}</div>
        </div>
      </div>
    </div>
  </ResponsiveContainer>
</template>

<script>
import { articleApi } from '@/api/article'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ResponsiveContainer from '@/components/ResponsiveContainer.vue'

export default {
  name: 'ArticleView',
  components: {
    LoadingSpinner,
    ResponsiveContainer
  },
  data() {
    return {
      sessionId: null,
      article: null,
      loading: false,
      error: '',
      targetWords: [],
      showTooltip: false,
      currentWord: null,
      tooltipStyle: {
        top: '0px',
        left: '0px'
      },
      tooltip: null,
      showRewriteMenu: false,
      imageLoading: true,
      imageError: false
    }
  },
  computed: {
    formattedEnglishText() {
      if (!this.article || !this.article.englishText || !this.article.targetWords) {
        return '';
      }

      let text = this.article.englishText;
      const targetWordSet = new Set(this.article.targetWords.map(word => word.word.toLowerCase()));

      // 使用正则表达式匹配单词边界
      const wordRegex = /\b\w+\b/g;
      text = text.replace(wordRegex, (match) => {
        const lowerMatch = match.toLowerCase();
        if (targetWordSet.has(lowerMatch)) {
          const wordInfo = this.article.targetWords.find(w => w.word.toLowerCase() === lowerMatch);
          return `<span class="target-word" data-word="${wordInfo.word}" data-phonetic="${wordInfo.phonetic || ''}" data-meaning="${wordInfo.chinese_meaning || ''}" data-example="${wordInfo.usage_example || ''}">${match}</span>`;
        }
        return match;
      });

      return text;
    }
  },
  created() {
    console.log('ArticleView created 钩子开始执行')
    // 从 query 参数获取 sessionId
    this.sessionId = this.$route.query.sessionId
    console.log('从路由 query 获取的 sessionId:', this.sessionId)
    
    // 从 localStorage 获取会话数据
    const sessionData = localStorage.getItem('currentSession')
    console.log('从 localStorage 获取的原始数据:', sessionData)
    
    if (sessionData) {
      const { sessionId: storedSessionId, article, quizQuestions } = JSON.parse(sessionData)
      console.log('解析后的会话数据:', {
        storedSessionId,
        hasArticle: !!article,
        hasQuizQuestions: !!quizQuestions
      })
      
      // 如果路由参数中没有 sessionId，使用存储的 sessionId
      if (!this.sessionId && storedSessionId) {
        console.log('使用存储的 sessionId:', storedSessionId)
        this.sessionId = storedSessionId
      }
      this.article = article
      this.quizQuestions = quizQuestions
    } else {
      console.log('localStorage 中没有会话数据，准备从服务器获取')
      this.fetchArticle()
    }
  },
  methods: {
    async fetchArticle() {
      try {
        this.loading = true
        this.error = ''
        const articles = await articleApi.getArticles(this.sessionId)
        console.log('API Response (raw):', JSON.stringify(articles, null, 2))
        
        if (articles && articles.length > 0) {
          this.article = articles[0]
          console.log('Article data received (detailed):', {
            id: this.article.id,
            title: this.article.title,
            hasEnglishText: !!this.article.englishText,
            hasChineseText: !!this.article.chineseText,
            hasImageUrl: !!this.article.imageUrl,
            imageUrl: this.article.imageUrl,
            rawData: JSON.stringify(this.article, null, 2)
          })
          
          // 检查 imageUrl 是否存在
          if (this.article.imageUrl) {
            console.log('Image URL found:', this.article.imageUrl)
          } else {
            console.warn('Image URL is missing from article data')
          }
          
          // 获取目标单词详细信息
          this.targetWords = this.article.targetWordDetails || []
          console.log('Target words:', this.targetWords.map(word => ({
            word: word.word,
            hasPhonetic: !!word.phonetic,
            hasMeaning: !!word.chinese_meaning,
            hasExample: !!word.usage_example
          })))

          // 在数据加载完成后，添加事件监听
          this.$nextTick(() => {
            this.addWordEventListeners()
          })
        } else {
          this.error = '未找到文章'
        }
      } catch (err) {
        console.error('Error fetching article:', err)
        this.error = '获取文章失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    addWordEventListeners() {
      const englishText = document.querySelector('.english-text')
      if (englishText) {
        englishText.addEventListener('mouseover', this.handleWordHover)
        englishText.addEventListener('mouseout', this.handleWordLeave)
      }
    },
    handleWordHover(event) {
      const targetWord = event.target;
      if (!targetWord.classList.contains('target-word')) return;

      const word = targetWord.dataset.word;
      const phonetic = targetWord.dataset.phonetic;
      const meaning = targetWord.dataset.meaning;
      const example = targetWord.dataset.example;

      console.log('Word hover:', { word, phonetic, meaning, example });

      this.tooltip = {
        word,
        phonetic,
        meaning,
        example,
        visible: true,
        x: event.clientX,
        y: event.clientY
      };
    },
    handleWordLeave() {
      this.showTooltip = false
      this.currentWord = null
    },
    async startQuiz() {
      try {
        console.log('开始测试按钮被点击')
        const sessionData = localStorage.getItem('currentSession')
        console.log('从 localStorage 获取的会话数据:', sessionData)
        
        if (sessionData) {
          const { sessionId } = JSON.parse(sessionData)
          console.log('解析后的 sessionId:', sessionId)
          
          if (sessionId) {
            console.log('准备跳转到测试页面，sessionId:', sessionId)
            this.$router.push({
              name: 'quiz',
              params: { sessionId: sessionId.toString() }
            })
          } else {
            console.error('sessionId 不存在')
            this.error = '无法获取会话ID，请重新开始学习'
          }
        } else {
          console.error('会话数据不存在')
          this.error = '无法获取会话数据，请重新开始学习'
        }
      } catch (error) {
        console.error('开始测试失败:', error)
        this.error = '开始测试失败，请重试'
      }
    },
    toggleRewriteMenu() {
      this.showRewriteMenu = !this.showRewriteMenu
    },
    async rewriteArticle(type) {
      try {
        this.loading = true
        this.error = ''
        this.showRewriteMenu = false
        
        const response = await articleApi.rewriteArticle(this.sessionId, type)
        if (response) {
          this.article = response
          // 重新添加事件监听
          this.$nextTick(() => {
            this.addWordEventListeners()
          })
        }
      } catch (err) {
        console.error('Error rewriting article:', err)
        this.error = '改写文章失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    handleImageError(error) {
      console.error('Image failed to load:', error)
      this.imageError = true
      this.imageLoading = false
    },
    handleImageLoad() {
      console.log('Image loaded successfully')
      this.imageLoading = false
      this.imageError = false
    },
    async generateImage() {
      try {
        this.imageLoading = true
        this.imageError = false
        
        // 使用文章标题作为图片提示词
        const prompt = this.article.title
        // 确保 URL 正确编码
        const encodedPrompt = encodeURIComponent(prompt)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=300&quality=80`
        
        console.log('Generated image URL:', imageUrl)
        
        // 预加载图片
        const img = new Image()
        img.onload = () => {
          this.article.imageUrl = imageUrl
          this.imageLoading = false
        }
        img.onerror = (error) => {
          console.error('Image failed to load:', error)
          this.imageError = true
          this.imageLoading = false
        }
        img.src = imageUrl
      } catch (error) {
        console.error('Error generating image:', error)
        this.imageError = true
        this.imageLoading = false
      }
    },
    validateImageUrl(url) {
      if (!url) {
        console.log('No image URL provided');
        return false;
      }
      
      // 检查是否是 Base64 格式的图片
      if (url.startsWith('data:image/')) {
        try {
          // 分离 MIME 类型和 Base64 数据
          const [header, base64Data] = url.split(',');
          if (!base64Data) {
            console.error('Invalid Base64 data: missing data part');
            return false;
          }

          // 验证 MIME 类型
          const mimeType = header.split(':')[1].split(';')[0];
          if (!mimeType.startsWith('image/')) {
            console.error('Invalid MIME type:', mimeType);
            return false;
          }

          // 验证 Base64 数据的长度
          if (base64Data.length < 100) {
            console.error('Invalid Base64 data: too short');
            return false;
          }

          // 验证 Base64 字符的有效性
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(base64Data)) {
            console.error('Invalid Base64 data: contains invalid characters');
            return false;
          }

          // 验证 Base64 数据的完整性
          const padding = base64Data.length % 4;
          if (padding > 0) {
            // 尝试添加正确的填充
            const paddedData = base64Data + '='.repeat(4 - padding);
            if (paddedData.length % 4 !== 0) {
              console.error('Invalid Base64 data: padding correction failed');
              return false;
            }
            // 更新 URL 中的 Base64 数据
            url = `data:${mimeType};base64,${paddedData}`;
            if (this.article) {
              this.article.imageUrl = url;
            }
          }

          // 尝试解码 Base64 数据以验证其有效性
          try {
            const binaryString = atob(base64Data);
            if (binaryString.length === 0) {
              console.error('Invalid Base64 data: empty after decoding');
              return false;
            }
          } catch (error) {
            console.error('Error decoding Base64 data:', error);
            return false;
          }

          console.log('Valid Base64 image URL detected', {
            mimeType,
            base64Length: base64Data.length,
            padding
          });
          return true;
        } catch (error) {
          console.error('Error validating Base64 data:', error);
          return false;
        }
      }
      
      // 检查是否是有效的 URL
      try {
        new URL(url);
        console.log('Valid URL detected');
        return true;
      } catch (error) {
        console.error('Invalid URL:', error);
        return false;
      }
    }
  },
  beforeDestroy() {
    // 移除事件监听器
    const englishText = document.querySelector('.english-text')
    if (englishText) {
      englishText.removeEventListener('mouseover', this.handleWordHover)
      englishText.removeEventListener('mouseout', this.handleWordLeave)
    }
  }
}
</script>

<style scoped>
.article-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

.article-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.article-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-header h1 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}

.article-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.text-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.article-image {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
}

.image-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.article-image img {
  width: 100%;
  height: 300px;
  display: block;
  object-fit: cover;
}

.english-text, .chinese-text {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.english-text h2, .chinese-text h2 {
  font-size: 1.4em;
  color: #666;
  margin-top: 0;
  margin-bottom: 10px;
}

.english-text :deep(.target-word) {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.english-text :deep(.target-word:hover) {
  background-color: #ffe69c;
}

.word-tooltip {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  transform: translate(-50%, -100%);
  margin-top: -10px;
}

.tooltip-content {
  font-size: 14px;
}

.tooltip-content .word {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.tooltip-content .phonetic {
  color: #666;
  font-style: italic;
  margin-bottom: 4px;
}

.tooltip-content .meaning {
  color: #2c3e50;
  margin-bottom: 4px;
}

.tooltip-content .example {
  color: #666;
  font-style: italic;
  border-top: 1px solid #eee;
  padding-top: 4px;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.start-quiz-btn {
  padding: 12px 24px;
  font-size: 1.1em;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-quiz-btn:hover {
  background-color: #45a049;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #dc3545;
}

.error button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error button:hover {
  background: #0056b3;
}

.rewrite-dropdown {
  position: relative;
}

.rewrite-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rewrite-btn:hover {
  background: #0056b3;
}

.arrow-down {
  font-size: 12px;
}

.rewrite-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  z-index: 100;
}

.rewrite-menu button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.rewrite-menu button:hover {
  background: #f8f9fa;
}
</style> 