const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_collab'
});

db.connect(err => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
        return;
    }
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
});

// تسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'البريد الإلكتروني موجود مسبقاً' });
                    }
                    return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
                }
                res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, users) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (users.length === 0) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token, 
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
});

// التحقق من صحة التوكن
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'توكن غير صالح' });
        req.user = user;
        next();
    });
};

// جلب مهام المستخدم
app.get('/api/tasks', authenticateToken, (req, res) => {
    db.query(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, tasks) => {
            if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
            res.json(tasks);
        }
    );
});

// إنشاء مهمة جديدة
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    
    db.query(
        'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
        [req.user.id, title, description],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'خطأ في إنشاء المهمة' });
            res.status(201).json({ id: result.insertId, title, description });
        }
    );
});

// مشاركة مهمة
app.post('/api/tasks/:id/share', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const { sharedWithUserId, permission = 'view' } = req.body;
    
    db.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id], (err, tasks) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (tasks.length === 0) return res.status(404).json({ error: 'المهمة غير موجودة' });
        
        db.query(
            'INSERT INTO shared_tasks (task_id, shared_with_user_id, permission) VALUES (?, ?, ?)',
            [taskId, sharedWithUserId, permission],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'المهمة مشاركة بالفعل مع هذا المستخدم' });
                    }
                    return res.status(500).json({ error: 'خطأ في المشاركة' });
                }
                res.json({ message: 'تمت المشاركة بنجاح' });
            }
        );
    });
});

// جلب المهام المشتركة معي
app.get('/api/shared-with-me', authenticateToken, (req, res) => {
    db.query(
        `SELECT t.*, u.username as owner_name, st.permission 
         FROM tasks t 
         JOIN shared_tasks st ON t.id = st.task_id 
         JOIN users u ON t.user_id = u.id 
         WHERE st.shared_with_user_id = ?`,
        [req.user.id],
        (err, tasks) => {
            if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
            res.json(tasks);
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});