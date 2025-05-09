import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, CardMedia, CircularProgress } from '@mui/material';
import { List, ListItem, ListItemText } from '@mui/material';

const Article = ({ article }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // 添加调试日志
  console.log('Article data:', article);
  console.log('Image URL:', article.imageUrl);

  const handleImageError = (e) => {
    console.error('Image load error:', e);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setImageLoading(false);
  };

  return (
    <Card sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
      <CardContent>
        <Typography variant="h4" component="h1" gutterBottom>
          {article.title}
        </Typography>
        
        {/* 图片显示部分 */}
        <Box sx={{ position: 'relative', height: 300, marginBottom: 2 }}>
          {imageLoading && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}>
              <CircularProgress />
            </Box>
          )}
          <CardMedia
            component="img"
            height="300"
            image={imageError ? '/images/default-article.jpg' : article.imageUrl}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            sx={{
              objectFit: 'cover',
              width: '100%',
              height: '300px',
              borderRadius: '8px',
              display: imageLoading ? 'none' : 'block'
            }}
          />
        </Box>

        {/* 文章内容部分 */}
        <Typography variant="body1" paragraph>
          {article.englishText}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {article.chineseText}
        </Typography>
        
        {/* 目标单词部分 */}
        <Typography variant="h6" gutterBottom>
          目标单词
        </Typography>
        <List>
          {article.targetWords.map((word, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1">
                    {word.word} {word.phonetic && `[${word.phonetic}]`}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {word.chinese_meaning}
                    </Typography>
                    {word.usage_example && (
                      <Typography variant="body2" color="text.secondary">
                        例句: {word.usage_example}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default Article; 