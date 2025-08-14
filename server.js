import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

const app = express();

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const comments = [];
let commentId = 1;

function findComment(id) {
  return comments.find(c => c.id === Number(id));
}

app.post('/api/posts/:postId/comments', (req, res) => {
  const { text, author } = req.body;
  if (!text) return res.status(400).json({ message: 'متن نظر الزامی است' });
  const comment = { id: commentId++, postId: req.params.postId, parentId: null, text, author: author || 'ناشناس', likes: 0, dislikes: 0, replies: [] };
  comments.push(comment);
  res.status(201).json(comment);
});

app.get('/api/posts/:postId/comments', (req, res) => {
  const list = comments.filter(c => c.postId === req.params.postId && !c.parentId);
  res.json(list);
});

app.post('/api/comments/:id/like', (req, res) => {
  const comment = findComment(req.params.id);
  if (!comment) return res.status(404).json({ message: 'یافت نشد' });
  comment.likes++;
  res.json({ likes: comment.likes });
});

app.post('/api/comments/:id/dislike', (req, res) => {
  const comment = findComment(req.params.id);
  if (!comment) return res.status(404).json({ message: 'یافت نشد' });
  comment.dislikes++;
  res.json({ dislikes: comment.dislikes });
});

app.post('/api/comments/:id/reply', (req, res) => {
  const parent = findComment(req.params.id);
  const { text, author } = req.body;
  if (!parent || !text) return res.status(400).json({ message: 'نامعتبر' });
  const reply = { id: commentId++, postId: parent.postId, parentId: parent.id, text, author: author || 'ناشناس', likes: 0, dislikes: 0, replies: [] };
  parent.replies.push(reply.id);
  comments.push(reply);
  res.status(201).json(reply);
});

app.get('/admin/comments', (req, res) => {
  res.json(comments);
});

app.post('/admin/comments/:id/respond', (req, res) => {
  const comment = findComment(req.params.id);
  const { response } = req.body;
  if (!comment || !response) return res.status(400).json({ message: 'نامعتبر' });
  comment.adminResponse = response;
  res.json(comment);
});

app.get('/api/news', (req, res) => {
  res.json([
    {
      title: 'برگزاری جشنواره فرهنگی',
      body: 'در پارک اصلی شهر اشنویه جشنواره‌ای با حضور هنرمندان محلی برگزار شد.'
    }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
