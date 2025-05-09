const { LearningSession, SessionInterest, Article, QuizQuestion, QuizQuestionOption, TargetWord } = require('../models');
const logger = require('../utils/logger');
const axios = require('axios');
const util = require('util');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 大模型 API 配置
const API_KEY = "73a3e416-ed9d-4376-b3b8-dac17621d3b7";
const MODEL_ID = "ep-20241227152824-bs4gz";

// 使用 Map 存储测试题生成状态
const quizGenerationStatus = new Map();

// 在后端添加缓存
const imageCache = new Map();

// 封装大模型调用
async function chatWithLargeModel(userMessage) {
    try {
        const response = await axios.post(
            'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            {
                model: MODEL_ID,
                messages: [{ role: 'user', content: userMessage }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        logger.error('Error calling large model:', error);
        throw new Error(error.response ? error.response.data : error.message);
    }
}

class LearningService {
  async createSession(englishLevel, interests, targetWords, userId) {
    try {
      if (!Array.isArray(interests)) {
        interests = [interests].filter(Boolean);
      }
      if (!Array.isArray(targetWords)) {
        targetWords = [targetWords].filter(Boolean);
      }

      // Create session
      const session = await LearningSession.create({
        englishLevel,
        userId,
        createdAt: new Date()
      });

      // 设置初始状态为生成中
      quizGenerationStatus.set(session.id, 'generating');

      // Save interests
      if (interests && interests.length > 0) {
        await Promise.all(interests.map(interest => 
          SessionInterest.create({ 
            sessionId: session.id, 
            interest: interest.toString()
          })
        ));
      }

      // Save target words
      if (targetWords && targetWords.length > 0) {
        // 生成单词解析
        const wordsPrompt = `For each of the following words, provide the information in this exact format:

Word: [word]
Phonetic: [phonetic]
Meaning: [chinese meaning]
Example: [usage example]

Words: ${targetWords.join(', ')}

Requirements:
1. Each word must follow the exact format above
2. Include all four fields for each word
3. Use clear labels (Word:, Phonetic:, Meaning:, Example:)
4. Separate each word with a blank line
5. Do not add any additional content`;

        const wordsContent = await chatWithLargeModel(wordsPrompt);
        logger.info('Words Content:', wordsContent);

        // 解析单词信息
        const parsedWords = this.parseTargetWords(wordsContent);
        const wordDetails = {};
        
        // 将解析的单词信息转换为对象
        parsedWords.forEach(word => {
          if (word.word) {
            wordDetails[word.word.toLowerCase()] = {
              phonetic: word.phonetic,
              chinese_meaning: word.chinese_meaning,
              usage_example: word.usage_example
            };
          }
        });

        // 保存目标单词及其详细信息
        await Promise.all(targetWords.map(word => {
          const details = wordDetails[word.toLowerCase()] || {};
          return TargetWord.create({
            sessionId: session.id,
            word: word,
            phonetic: details.phonetic,
            chinese_meaning: details.chinese_meaning,
            usage_example: details.usage_example
          });
        }));
      }

      // Generate and save article & enrich target words
      const { article, targetWordDetails } = await this.generateArticleAndWords(session.id, englishLevel, interests, targetWords);
      
      // 更新目标单词详细信息
      for (const wordObj of targetWordDetails) {
        await TargetWord.update({
          phonetic: wordObj.phonetic,
          chinese_meaning: wordObj.chinese_meaning,
          usage_example: wordObj.usage_example
        }, {
          where: { sessionId: session.id, word: wordObj.word }
        });
      }

      // 同步生成测试题
      try {
        const questions = await this.generateQuizQuestions(session.id, article.englishText);
        await Promise.all(questions.map(async (question) => {
          const createdQuestion = await QuizQuestion.create({
            sessionId: session.id,
            question: question.question,
            correctAnswerIndex: question.correctAnswerIndex,
            questionType: question.questionType,
            explanation: question.explanation
          });
          // 按顺序创建选项，确保顺序与 AI 生成时一致
          for (let i = 0; i < question.options.length; i++) {
            await QuizQuestionOption.create({
              questionId: createdQuestion.id,
              optionText: question.options[i],
              optionOrder: i
            });
          }
        }));
        // 更新测试题生成状态为完成
        quizGenerationStatus.set(session.id, 'completed');
        logger.info('Quiz questions generated successfully');
      } catch (error) {
        // 更新测试题生成状态为失败
        quizGenerationStatus.set(session.id, 'failed');
        logger.error('Error generating quiz questions:', error);
        throw error; // 向上传递错误
      }

      // 只返回必要的字段，避免循环引用
      return {
        id: session.id,
        englishLevel: session.englishLevel,
        createdAt: session.createdAt,
        interests: interests,
        targetWords: targetWords,
        article: {
          id: article.id,
          title: article.title,
          englishText: article.englishText,
          chineseText: article.chineseText,
          imageUrl: article.imageUrl,
          targetWords: targetWordDetails.map(word => ({
            word: word.word,
            phonetic: word.phonetic || '',
            chinese_meaning: word.chinese_meaning || '',
            usage_example: word.usage_example || ''
          }))
        },
        quizQuestions: await this.getQuizQuestions(session.id) // 直接返回生成的测试题
      };
    } catch (error) {
      logger.error('Error in createSession:', error);
      throw error;
    }
  }

  async generateArticleAndWords(sessionId, englishLevel, interests, targetWords) {
    try {
      // 1. 生成文章内容
      const articlePrompt = `Generate an English article based on the following requirements:
1. Vocabulary Level: ${englishLevel}
2. Interests: ${interests.join(', ')}
3. Target Words: ${targetWords.join(', ')}
4. Article Length: ${targetWords.length * 30} words
5. Difficulty: Appropriate for the specified vocabulary level
6. Content: engaging, interesting, eccentric and wild
7. Format: 
   English Title: [title]
   English Text: [text]
   Chinese Title: [title]
   Chinese Text: [text]

Requirements:
- Use all target words naturally in the article
- Keep the article engaging, interesting, eccentric and wild
- Ensure the content is appropriate for the vocabulary level
- All words used must be from the specified vocabulary level`;

      const articleContent = await chatWithLargeModel(articlePrompt);
      logger.info('Article Content:', articleContent);

      // 提取文章内容
      const englishTitle = this.extractContent(articleContent, "English Title:", "English Text:");
      const englishText = this.extractContent(articleContent, "English Text:", "Chinese Title:");
      const chineseTitle = this.extractContent(articleContent, "Chinese Title:", "Chinese Text:");
      const chineseText = this.extractContent(articleContent, "Chinese Text:", null);

      // 2. 生成单词解析
      const wordsPrompt = `For each of the following words, provide the information in this exact format:

Word: [word]
Phonetic: [phonetic]
Meaning: [chinese meaning]
Example: [usage example]

Words: ${targetWords.join(', ')}

Requirements:
1. Each word must follow the exact format above
2. Include all four fields for each word
3. Use clear labels (Word:, Phonetic:, Meaning:, Example:)
4. Separate each word with a blank line
5. Do not add any additional content`;

      const wordsContent = await chatWithLargeModel(wordsPrompt);
      logger.info('Words Content:', wordsContent);

      const targetWordDetails = this.parseTargetWords(wordsContent);

      const article = {
          sessionId,
          title: englishTitle,
          englishText: englishText,
          chineseText: chineseText,
          articleOrder: 1,
          expiredAt: new Date(Date.now() + 15 * 60 * 1000)
      };

      // 生成文章图片
      const imageUrl = await this.getArticleImage(englishTitle, englishText);
      if (imageUrl) {
        article.imageUrl = imageUrl;
        logger.info('Article image URL set:', { imageUrl });
      } else {
        logger.warn('Failed to generate article image');
      }

      // 创建文章并保存到数据库
      const createdArticle = await Article.create(article);
      logger.info('Article created:', {
        id: createdArticle.id,
        title: createdArticle.title,
        hasImageUrl: !!createdArticle.imageUrl,
        imageUrl: createdArticle.imageUrl
      });

      return { article: createdArticle.toJSON(), targetWordDetails };
    } catch (error) {
      logger.error('Error in generateArticleAndWords:', error);
      throw error;
    }
  }

  extractContent(text, startMarker, endMarker) {
    try {
      if (!text || !startMarker) {
        logger.error('Invalid input to extractContent:', { text, startMarker, endMarker });
        return '';
      }

      const startIndex = text.indexOf(startMarker);
      if (startIndex === -1) {
        logger.error('Start marker not found:', { startMarker, text });
        return '';
      }

      const contentStart = startIndex + startMarker.length;
      let contentEnd;

      if (endMarker) {
        contentEnd = text.indexOf(endMarker, contentStart);
        if (contentEnd === -1) {
          logger.warn('End marker not found, using end of text:', { endMarker, text });
          contentEnd = text.length;
        }
      } else {
        contentEnd = text.length;
      }

      const content = text.substring(contentStart, contentEnd).trim();
      logger.info('Extracted content:', { startMarker, endMarker, content });
      return content;
    } catch (error) {
      logger.error('Error in extractContent:', error);
      return '';
    }
  }

  parseTargetWords(text) {
    try {
      const words = [];
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      logger.info('Parsing target words from lines:', lines);

      let currentWord = null;
      let currentPhonetic = null;
      let currentMeaning = null;
      let currentExample = null;

      for (const line of lines) {
        // 检查是否是新的单词（以数字和点开头，或者直接是单词）
        if (line.startsWith('Word:') || /^[A-Za-z]+$/.test(line)) {
          // 如果已经有单词在处理中，保存它
          if (currentWord) {
            words.push({
              word: currentWord,
              phonetic: currentPhonetic || '',
              chinese_meaning: currentMeaning || '',
              usage_example: currentExample || ''
            });
          }
          // 开始新的单词
          currentWord = line.replace(/^Word:\s*/, '').trim();
          currentPhonetic = null;
          currentMeaning = null;
          currentExample = null;
        }
        // 检查音标
        else if (line.startsWith('Phonetic:')) {
          currentPhonetic = line.replace(/^Phonetic:\s*/, '').trim();
        }
        // 检查中文释义
        else if (line.startsWith('Meaning:')) {
          currentMeaning = line.replace(/^Meaning:\s*/, '').trim();
        }
        // 检查使用示例
        else if (line.startsWith('Example:')) {
          currentExample = line.replace(/^Example:\s*/, '').trim();
        }
      }

      // 保存最后一个单词
      if (currentWord) {
        words.push({
          word: currentWord,
          phonetic: currentPhonetic || '',
          chinese_meaning: currentMeaning || '',
          usage_example: currentExample || ''
        });
      }

      // 确保所有目标单词都有解析
      const targetWords = this.targetWords || [];
      for (const targetWord of targetWords) {
        if (!words.find(w => w.word.toLowerCase() === targetWord.toLowerCase())) {
          words.push({
            word: targetWord,
            phonetic: '',
            chinese_meaning: '',
            usage_example: ''
          });
        }
      }

      // 去重，保留第一个出现的完整解析
      const uniqueWords = [];
      const seenWords = new Set();
      for (const word of words) {
        if (!seenWords.has(word.word.toLowerCase())) {
          seenWords.add(word.word.toLowerCase());
          uniqueWords.push(word);
        }
      }

      logger.info('Parsed words:', uniqueWords);
      return uniqueWords;
    } catch (error) {
      logger.error('Error parsing target words:', error);
      return [];
    }
  }

  async generateQuizQuestions(sessionId, articleContent) {
    try {
      const prompt = `请根据以下文章内容生成3个测验题目，包括1个词汇题、1个理解题和1个语法题。
文章内容：
${articleContent}

请按照以下格式返回，每个问题之间用'---'分隔：
问题类型: vocab/comprehension/grammar
问题: 问题内容
选项1: 选项内容
选项2: 选项内容
选项3: 选项内容
选项4: 选项内容
正确答案: 只包含选项编号(1-4)，不要使用'选项X'格式
解析: 解析说明（必须与正确答案一致，解释为什么这个选项是正确的）

要求：
1. 每个问题必须包含所有字段
2. 正确答案必须是1-4之间的数字
3. 解析必须与正确答案一致，解释为什么这个选项是正确的
4. 词汇题必须包含单词的准确含义
5. 理解题必须基于文章内容
6. 语法题必须关注文章中的语法点

---`;

      const content = await chatWithLargeModel(prompt);
      logger.info('OpenAI Response:', { content });

      const questions = this.parseQuizQuestions(content);
      logger.info('Parsed questions:', { questions });
      
      return questions;
    } catch (error) {
      logger.error('Error generating quiz questions:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  parseQuizQuestions(text) {
    const questions = [];
    const questionBlocks = text.split('---');

    for (const block of questionBlocks) {
      if (block.trim() === '') continue;

      const lines = block.trim().split('\n');
      logger.info('Processing question block:', { lines });

      try {
        // 确保每行都有正确的格式
        if (lines.length < 8) {
          logger.error('Invalid question format:', { lines });
          continue;
        }

        // 解析问题类型
        const typeLine = lines[0].trim();
        const typeMatch = typeLine.match(/问题类型:\s*(vocab|comprehension|grammar)/i);
        if (!typeMatch) {
          logger.error('Invalid question type format:', { line: typeLine });
          continue;
        }
        const questionType = typeMatch[1].toUpperCase();

        // 解析问题
        const questionLine = lines[1].trim();
        const questionMatch = questionLine.match(/问题:\s*(.+)/);
        if (!questionMatch) {
          logger.error('Invalid question format:', { line: questionLine });
          continue;
        }
        const questionText = questionMatch[1];

        // 解析选项
        const options = [];
        for (let i = 2; i < 6; i++) {
          const optionLine = lines[i].trim();
          const optionMatch = optionLine.match(/选项\d+:\s*(.+)/);
          if (!optionMatch) {
            logger.error('Invalid option format:', { line: optionLine });
            continue;
          }
          options.push(optionMatch[1]);
        }

        // 解析正确答案
        const answerLine = lines[6].trim();
        const answerMatch = answerLine.match(/正确答案:\s*(\d)/);
        if (!answerMatch) {
          logger.error('Invalid answer format:', { line: answerLine });
          continue;
        }
        // 将答案索引从1-4转换为0-3
        let correctAnswerIndex = parseInt(answerMatch[1]) - 1;
        if (isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
          logger.error('Invalid answer index:', { index: correctAnswerIndex });
          continue;
        }

        // 解析解释
        const explanationLine = lines[7].trim();
        const explanationMatch = explanationLine.match(/解析:\s*(.+)/);
        if (!explanationMatch) {
          logger.error('Invalid explanation format:', { line: explanationLine });
          continue;
        }
        const explanation = explanationMatch[1];

        // 验证答案和解析的一致性
        const explanationText = explanation.toLowerCase();
        const correctOption = options[correctAnswerIndex].toLowerCase();
        
        // 如果解析中没有提到正确答案，尝试从解析中提取正确的选项
        if (!explanationText.includes(correctOption)) {
          logger.warn('Answer and explanation mismatch:', {
            correctOption,
            explanation: explanationText
          });
          
          // 遍历所有选项，查找在解析中提到的选项
          let foundMatch = false;
          for (let i = 0; i < options.length; i++) {
            const optionText = options[i].toLowerCase();
            // 检查选项是否在解析中被完整提及
            if (explanationText.includes(optionText) && 
                (optionText.length > 3 || explanationText.includes(`"${optionText}"`) || explanationText.includes(`'${optionText}'`))) {
              logger.info('Found matching option in explanation:', {
                originalIndex: correctAnswerIndex,
                newIndex: i,
                option: optionText
              });
              correctAnswerIndex = i;
              foundMatch = true;
              break;
            }
          }

          // 如果没有找到完整匹配，尝试部分匹配
          if (!foundMatch) {
            for (let i = 0; i < options.length; i++) {
              const optionText = options[i].toLowerCase();
              if (explanationText.includes(optionText)) {
                logger.info('Found partial matching option in explanation:', {
                  originalIndex: correctAnswerIndex,
                  newIndex: i,
                  option: optionText
                });
                correctAnswerIndex = i;
                break;
              }
            }
          }
        }

        questions.push({
          question: questionText,
          options: options,
          correctAnswerIndex: correctAnswerIndex,
          questionType: questionType,
          explanation: explanation
        });

        logger.info('Successfully parsed question:', {
          question: questionText,
          options: options,
          correctAnswerIndex: correctAnswerIndex,
          questionType: questionType,
          explanation: explanation
        });
      } catch (error) {
        logger.error('Error parsing question block:', error);
        continue;
      }
    }

    return questions;
  }

  async getArticles(sessionId) {
    try {
      logger.info('Getting articles for session:', sessionId);
      
      // 获取文章
      const articles = await Article.findAll({
        where: { sessionId },
        order: [['articleOrder', 'ASC']]
      });

      if (!articles || articles.length === 0) {
        logger.error('No articles found for session:', sessionId);
        return [];
      }

      // 获取目标单词
      const targetWords = await TargetWord.findAll({
        where: { 
          sessionId
        },
        attributes: ['word', 'phonetic', 'chinese_meaning', 'usage_example']
      });

      logger.info('Found target words:', targetWords);

      // 格式化返回数据
      const formattedArticles = articles.map(article => {
        // 添加详细的日志
        logger.info('Raw article data:', {
          id: article.id,
          title: article.title,
          imageUrl: article.imageUrl,
          rawData: article.toJSON()
        });
        
        const formattedArticle = {
          id: article.id,
          title: article.title,
          englishText: article.englishText,
          chineseText: article.chineseText,
          imageUrl: article.imageUrl,
          targetWords: targetWords.map(word => ({
            word: word.word,
            phonetic: word.phonetic || '',
            chinese_meaning: word.chinese_meaning || '',
            usage_example: word.usage_example || ''
          }))
        };

        // 记录格式化后的数据
        logger.info('Formatted article data:', {
          id: formattedArticle.id,
          title: formattedArticle.title,
          hasImageUrl: !!formattedArticle.imageUrl,
          imageUrl: formattedArticle.imageUrl
        });

        return formattedArticle;
      });

      return formattedArticles;
    } catch (error) {
      logger.error('Error in getArticles:', error);
      throw error;
    }
  }

  async getQuizQuestions(sessionId) {
    try {
      logger.info('Getting quiz questions for session:', sessionId);
      
      // 获取问题
      const questions = await QuizQuestion.findAll({
        where: { sessionId },
        include: [{
          model: QuizQuestionOption,
          as: 'options',
          attributes: ['optionText'],
          order: [['id', 'ASC']] // 确保选项按创建顺序排序
        }],
        order: [['id', 'ASC']] // 确保问题按创建顺序排序
      });

      if (!questions || questions.length === 0) {
        logger.error('No quiz questions found for session:', sessionId);
        throw new Error('No quiz questions found');
      }

      logger.info('Found questions:', questions.map(q => ({
        id: q.id,
        question: q.question,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        questionType: q.questionType,
        options: q.options.map(o => o.optionText)
      })));

      // 格式化返回数据
      const formattedQuestions = questions.map(question => ({
        id: question.id,
        question: question.question,
        options: question.options.map(option => option.optionText),
        correct_answer_index: question.correctAnswerIndex,
        question_type: question.questionType,
        explanation: question.explanation
      }));

      return formattedQuestions;
    } catch (error) {
      logger.error('Error getting quiz questions:', error);
      throw error;
    }
  }

  async getArticleImage(title, content) {
    try {
      // 移除标题和内容中的方括号
      const cleanTitle = title.replace(/[\[\]]/g, '');
      const cleanContent = content.replace(/[\[\]]/g, '');
      // 构建完整的提示词，包含标题和完整内容
      const prompt = `${cleanTitle}. ${cleanContent}`;
      // 构建 Pollinations.AI 的 URL，设置较小的图片尺寸
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&quality=80`;
      
      // 输出详细的日志信息
      logger.info('Image Generation Details:', {
        title: cleanTitle,
        content: cleanContent,
        prompt: prompt,
        url: pollinationsUrl
      });
      
      return pollinationsUrl;
    } catch (error) {
      logger.error('Error generating article image:', error);
      return null;
    }
  }

  async validateImage(imageUrl) {
    try {
      const response = await axios.head(imageUrl);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async generateArticleImage(title, content) {
    try {
      const imageUrl = await this.getArticleImage(title, content);
      const isValid = await this.validateImage(imageUrl);
      return isValid ? imageUrl : null;
    } catch (error) {
      logger.error('Error generating article image:', error);
      return null;
    }
  }

  async rewriteArticle(sessionId, type) {
    try {
      // 获取当前会话信息
      const session = await LearningSession.findByPk(sessionId, {
        include: [
          { model: SessionInterest, as: 'interests', attributes: ['interest'] },
          { model: TargetWord, as: 'targetWords', attributes: ['word', 'phonetic', 'chinese_meaning', 'usage_example'] }
        ]
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // 获取当前文章
      const currentArticle = await Article.findOne({
        where: { sessionId },
        order: [['articleOrder', 'DESC']]
      });

      if (!currentArticle) {
        throw new Error('Article not found');
      }

      // 获取兴趣列表和目标单词列表
      const interests = session.interests.map(si => si.interest);
      const targetWords = session.targetWords;

      // 构造改写提示
      const rewritePrompt = `请根据以下要求改写文章：
[原文章内容]
${currentArticle.englishText}

改写类型：${type === 'increase' ? '提高难度' : '降低难度'}

要求：
1. 词汇调整：
   - ${type === 'increase' ? '使用更高级的词汇，增加专业术语' : '使用更基础的词汇，避免复杂词'}

2. 语法调整：
   - ${type === 'increase' ? '增加复合句、从句使用' : '使用简单句，减少从句'}

3. 句式调整：
   - ${type === 'increase' ? '增加长难句，使用复杂句式' : '使用短句，简化句式结构'}

4. 内容要求：
   - 保持主题不变，主题与以下兴趣相关：${interests.join(', ')}
   - 保持目标单词的使用，需要包含以下目标单词：${targetWords.map(tw => tw.word).join(', ')}
   - 保持文章长度（${targetWords.length * 30} 词）
   - 保持趣味性

5. 格式要求：
   请严格按照以下格式返回，不要添加任何其他内容：
   英文标题: [在这里写英文标题]
   英文正文: [在这里写英文正文]
   中文标题: [在这里写中文标题]
   中文正文: [在这里写中文正文]

注意：
1. 请确保文章中的单词都来自${session.englishLevel}词库，不要使用超出范围的单词
2. 必须严格按照上述格式返回，包括冒号后的空格
3. 不要在格式标记外添加任何其他内容`;

      const content = await chatWithLargeModel(rewritePrompt);
      logger.info('Rewrite response content:', content);

      // 解析生成的内容
      const englishTitle = this.extractContent(content, "英文标题:", "英文正文:");
      const englishText = this.extractContent(content, "英文正文:", "中文标题:");
      const chineseTitle = this.extractContent(content, "中文标题:", "中文正文:");
      const chineseText = this.extractContent(content, "中文正文:", null);

      if (!englishTitle || !englishText || !chineseTitle || !chineseText) {
        logger.error('Failed to parse content. Content received:', content);
        throw new Error('Failed to parse rewritten article content');
      }

      // 获取文章相关图片
      const imageUrl = await this.generateArticleImage(englishTitle, englishText);

      // 创建新的文章记录
      const newArticle = await Article.create({
        sessionId,
        title: englishTitle,
        englishText,
        chineseText,
        articleOrder: currentArticle.articleOrder + 1,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000),
        imageUrl // 直接存储图片URL
      });

      // 返回新文章信息，包含完整的目标单词信息和图片URL
      return {
        id: newArticle.id,
        title: newArticle.title,
        englishText: newArticle.englishText,
        chineseText: newArticle.chineseText,
        imageUrl: newArticle.imageUrl,
        targetWords: targetWords.map(word => ({
          word: word.word,
          phonetic: word.phonetic || '',
          chinese_meaning: word.chinese_meaning || '',
          usage_example: word.usage_example || ''
        }))
      };
    } catch (error) {
      logger.error('Error in rewriteArticle:', error);
      throw error;
    }
  }

  // 修改获取测试题状态的方法
  async getQuizStatus(sessionId) {
    try {
      const status = quizGenerationStatus.get(sessionId);
      if (!status) {
        throw new Error('Session not found');
      }
      return status;
    } catch (error) {
      logger.error('Error getting quiz status:', error);
      throw error;
    }
  }
}

module.exports = new LearningService(); 