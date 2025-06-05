// Supabase 配置
const SUPABASE_URL = 'https://mkeabsltkvfilsushefl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZWFic2x0a3ZmaWxzdXNoZWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzY5MjMsImV4cCI6MjA2NDQxMjkyM30.mlJqJPr_nmMZWyZ5JCkwZZyB-Z6vpuVhG091FJomrqw';

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局变量
let statusIndicator;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.innerHTML = '<span id="statusText">正在连接数据库...</span>';
    
    console.log('=== 爱的记录网站初始化开始 ===');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('当前时间:', new Date().toLocaleString());
    
    // 初始化各个模块
    initializeLoveCounter();
    loadMessages();
    loadPhotos();
    loadMemories();
    loadTimelineEvents();
    loadMoods();
    loadDolls();
    
    // 设置键盘快捷键
    setupKeyboardShortcuts();
    
    // 测试数据库连接
    testDatabaseConnection();
    
    console.log('=== 页面初始化完成 ===');
});

// 显示调试信息
function showDollDebugInfo(message) {
    // 只在控制台显示调试信息，不在页面上显示
    console.log('调试信息:', message.replace(/<[^>]*>/g, '')); // 移除HTML标签
    
    // 如果需要在页面显示，取消下面的注释
    /*
    const debugInfo = document.getElementById('dollDebugInfo');
    const debugText = document.getElementById('dollDebugText');
    
    if (debugInfo && debugText) {
        // 如果显示成功信息，3秒后自动隐藏
        if (message.includes('✅') && message.includes('系统就绪')) {
            debugInfo.style.display = 'block';
            debugText.innerHTML = message + ' <button onclick="hideDollDebugInfo()" style="margin-left: 10px; padding: 2px 8px; background: rgba(255,255,255,0.3); border: none; border-radius: 5px; color: white; cursor: pointer;">隐藏</button>';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                hideDollDebugInfo();
            }, 3000);
        } else {
            // 错误信息显示关闭按钮
            debugInfo.style.display = 'block';
            debugText.innerHTML = message + ' <button onclick="hideDollDebugInfo()" style="margin-left: 10px; padding: 2px 8px; background: rgba(255,255,255,0.3); border: none; border-radius: 5px; color: white; cursor: pointer;">关闭</button>';
        }
    }
    */
}

// 隐藏调试信息
function hideDollDebugInfo() {
    const debugInfo = document.getElementById('dollDebugInfo');
    if (debugInfo) {
        debugInfo.style.display = 'none';
    }
}

// 测试数据库连接
async function testDatabaseConnection() {
    try {
        showDollDebugInfo('正在检查数据库连接...');
        
        // 测试消息表连接
        const { data, error } = await supabase
            .from('messages')
            .select('count')
            .limit(1);
        
        if (error) {
            updateStatus('error', '数据库连接失败');
            showDollDebugInfo(`数据库连接失败: ${error.message}`);
            console.error('Database connection error:', error);
            return;
        }
        
        // 测试娃娃表是否存在
        try {
            const { data: dollsData, error: dollsError } = await supabase
                .from('dolls')
                .select('count')
                .limit(1);
            
            if (dollsError) {
                console.warn('娃娃表不存在或无法访问:', dollsError);
                if (dollsError.code === 'PGRST116') {
                    showDollDebugInfo('❌ 娃娃表(dolls)不存在，请先创建数据库表！<br>参考文档中的建表SQL语句');
                    console.log('需要创建dolls表');
                } else {
                    showDollDebugInfo(`❌ 娃娃表访问错误: ${dollsError.message}`);
                }
            } else {
                console.log('娃娃表连接正常');
                showDollDebugInfo('✅ 娃娃表连接正常');
            }
        } catch (e) {
            console.warn('娃娃表检查失败:', e);
            showDollDebugInfo(`❌ 娃娃表检查失败: ${e.message}`);
        }
        
        // 测试Storage bucket是否存在
        try {
            const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
            
            if (bucketError) {
                console.warn('Storage访问失败:', bucketError);
                showDollDebugInfo(`❌ Storage访问失败: ${bucketError.message}`);
            } else {
                const dollsBucket = buckets.find(bucket => bucket.name === 'dolls');
                if (dollsBucket) {
                    console.log('娃娃存储桶存在');
                    showDollDebugInfo('✅ 娃娃存储桶存在，系统就绪！');
                } else {
                    console.warn('需要创建dolls存储桶');
                    showDollDebugInfo('❌ 需要创建dolls存储桶<br>请在Supabase Dashboard的Storage中创建"dolls" bucket');
                }
            }
        } catch (e) {
            console.warn('Storage检查失败:', e);
            showDollDebugInfo(`❌ Storage检查失败: ${e.message}`);
        }
        
        updateStatus('connected', '数据库连接成功');
        
    } catch (error) {
        updateStatus('error', '连接错误');
        showDollDebugInfo(`❌ 连接错误: ${error.message}`);
        console.error('Connection error:', error);
    }
}

// 更新状态指示器
function updateStatus(type, message) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    statusIndicator.className = `status-indicator ${type}`;
    statusText.textContent = message;
    
    // 3秒后如果是成功状态，自动隐藏
    if (type === 'connected') {
        setTimeout(() => {
            statusIndicator.style.opacity = '0.7';
        }, 3000);
    }
}

// 平滑滚动到指定区域
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// 初始化爱情计数器
function initializeLoveCounter() {
    const startDate = new Date('2023-09-26T19:00:00');
    
    function updateCounter() {
        const now = new Date();
        const diff = now - startDate;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
    }
    
    updateCounter();
    setInterval(updateCounter, 1000);
}

// 设置键盘快捷键
function setupKeyboardShortcuts() {
    // Ctrl+Enter 发送留言
    document.getElementById('messageInput').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            addMessage();
        }
    });
}

// 留言板功能
async function addMessage() {
    const author = document.getElementById('messageAuthor').value;
    const content = document.getElementById('messageInput').value.trim();
    
    if (!author) {
        alert('请选择作者！');
        return;
    }
    
    if (!content) {
        alert('请输入留言内容！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在保存留言...');
        
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    author: author,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        // 清空表单
        document.getElementById('messageAuthor').value = '';
        document.getElementById('messageInput').value = '';
        
        // 重新加载留言
        await loadMessages();
        updateStatus('connected', '留言保存成功');
        
    } catch (error) {
        console.error('Error adding message:', error);
        updateStatus('error', '留言保存失败');
    }
}

async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const messageList = document.getElementById('messageList');
        messageList.innerHTML = '';
        
        data.forEach(message => {
            const messageElement = createMessageElement(message);
            messageList.appendChild(messageElement);
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
        updateStatus('error', '加载留言失败');
    }
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'message-item';
    
    const date = new Date(message.created_at).toLocaleString('zh-CN');
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-author">${message.author}</span>
            <div>
                <span class="message-time">${date}</span>
                <button onclick="deleteMessage(${message.id})" class="delete-btn">删除</button>
            </div>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    return div;
}

async function deleteMessage(id) {
    if (!confirm('确定要删除这条留言吗？')) return;
    
    try {
        updateStatus('connecting', '正在删除留言...');
        
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadMessages();
        updateStatus('connected', '留言删除成功');
        
    } catch (error) {
        console.error('Error deleting message:', error);
        updateStatus('error', '删除失败');
    }
}

// 照片墙功能
async function uploadPhoto() {
    const fileInput = document.getElementById('photoInput');
    const description = document.getElementById('photoDescription').value.trim();
    
    if (!fileInput.files[0]) {
        alert('请选择照片！');
        return;
    }
    
    if (!description) {
        alert('请为照片添加描述！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在上传照片...');
        
        const file = fileInput.files[0];
        const fileName = `photo_${Date.now()}_${file.name}`;
        
        // 上传文件到 Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file);
        
        if (uploadError) {
            throw uploadError;
        }
        
        // 获取公共 URL
        const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);
        
        // 保存照片信息到数据库
        const { data, error } = await supabase
            .from('photos')
            .insert([
                {
                    url: urlData.publicUrl,
                    description: description,
                    filename: fileName,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        // 清空表单
        fileInput.value = '';
        document.getElementById('photoDescription').value = '';
        
        // 重新加载照片
        await loadPhotos();
        updateStatus('connected', '照片上传成功');
        
    } catch (error) {
        console.error('Error uploading photo:', error);
        updateStatus('error', '照片上传失败');
    }
}

async function loadPhotos() {
    try {
        const { data, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const photoGrid = document.getElementById('photoGrid');
        photoGrid.innerHTML = '';
        
        data.forEach(photo => {
            const photoElement = createPhotoElement(photo);
            photoGrid.appendChild(photoElement);
        });
        
    } catch (error) {
        console.error('Error loading photos:', error);
        updateStatus('error', '加载照片失败');
    }
}

function createPhotoElement(photo) {
    const div = document.createElement('div');
    div.className = 'photo-item';
    
    const date = new Date(photo.created_at).toLocaleDateString('zh-CN');
    
    div.innerHTML = `
        <img src="${photo.url}" alt="${photo.description}" onclick="viewPhoto('${photo.url}', '${photo.description}')">
        <div class="photo-info">
            <span class="photo-date">${date}</span>
            <div class="photo-description">${photo.description}</div>
            <button onclick="deletePhoto(${photo.id}, '${photo.filename}')" class="delete-btn">删除</button>
        </div>
    `;
    
    return div;
}

function viewPhoto(url, description) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.onclick = () => modal.remove();
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${url}" alt="${description}">
            <p>${description}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function deletePhoto(id, filename) {
    if (!confirm('确定要删除这张照片吗？')) return;
    
    try {
        updateStatus('connecting', '正在删除照片...');
        
        // 删除 Storage 中的文件
        const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([filename]);
        
        if (storageError) {
            console.warn('Storage delete warning:', storageError);
        }
        
        // 删除数据库记录
        const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadPhotos();
        updateStatus('connected', '照片删除成功');
        
    } catch (error) {
        console.error('Error deleting photo:', error);
        updateStatus('error', '删除失败');
    }
}

// 气鼓鼓模块功能
async function addMood() {
    const author = document.getElementById('moodAuthor').value;
    const level = document.getElementById('moodLevel').value;
    const reason = document.getElementById('moodReason').value.trim();
    const solution = document.getElementById('moodSolution').value.trim();
    
    if (!author) {
        alert('请选择是谁生气了！');
        return;
    }
    
    if (!level) {
        alert('请选择生气等级！');
        return;
    }
    
    if (!reason) {
        alert('请说明生气的原因！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在保存气鼓鼓记录...');
        
        const { data, error } = await supabase
            .from('moods')
            .insert([
                {
                    author: author,
                    level: level,
                    reason: reason,
                    solution: solution || '还在想办法哄...',
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        // 清空表单
        document.getElementById('moodAuthor').value = '';
        document.getElementById('moodLevel').value = '';
        document.getElementById('moodReason').value = '';
        document.getElementById('moodSolution').value = '';
        
        // 重新加载气鼓鼓记录
        await loadMoods();
        updateStatus('connected', '气鼓鼓记录保存成功');
        
    } catch (error) {
        console.error('Error adding mood:', error);
        updateStatus('error', '保存失败');
    }
}

async function loadMoods() {
    try {
        const { data, error } = await supabase
            .from('moods')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const moodList = document.getElementById('moodList');
        moodList.innerHTML = '';
        
        data.forEach(mood => {
            const moodElement = createMoodElement(mood);
            moodList.appendChild(moodElement);
        });
        
    } catch (error) {
        console.error('Error loading moods:', error);
        // 如果表不存在，静默处理
        if (error.code !== 'PGRST116') {
            updateStatus('error', '加载气鼓鼓记录失败');
        }
    }
}

function createMoodElement(mood) {
    const div = document.createElement('div');
    div.className = 'mood-item';
    
    const date = new Date(mood.created_at).toLocaleDateString('zh-CN');
    
    div.innerHTML = `
        <div class="mood-header">
            <span class="mood-author">${mood.author}</span>
            <div>
                <span class="mood-date">${date}</span>
                <button onclick="deleteMood(${mood.id})" class="delete-btn">删除</button>
            </div>
        </div>
        <div class="mood-level">${mood.level}</div>
        <div class="mood-reason">${mood.reason}</div>
        <div class="mood-solution">${mood.solution}</div>
    `;
    
    return div;
}

async function deleteMood(id) {
    if (!confirm('确定要删除这条气鼓鼓记录吗？')) return;
    
    try {
        updateStatus('connecting', '正在删除记录...');
        
        const { error } = await supabase
            .from('moods')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadMoods();
        updateStatus('connected', '记录删除成功');
        
    } catch (error) {
        console.error('Error deleting mood:', error);
        updateStatus('error', '删除失败');
    }
}

// 美好回忆功能
async function addMemory() {
    const title = document.getElementById('memoryTitle').value.trim();
    const date = document.getElementById('memoryDate').value;
    const content = document.getElementById('memoryContent').value.trim();
    
    if (!title) {
        alert('请输入回忆标题！');
        return;
    }
    
    if (!date) {
        alert('请选择日期！');
        return;
    }
    
    if (!content) {
        alert('请描述这个美好的回忆！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在保存回忆...');
        
        const { data, error } = await supabase
            .from('memories')
            .insert([
                {
                    title: title,
                    memory_date: date,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        // 清空表单
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDate').value = '';
        document.getElementById('memoryContent').value = '';
        
        // 重新加载回忆
        await loadMemories();
        updateStatus('connected', '回忆保存成功');
        
    } catch (error) {
        console.error('Error adding memory:', error);
        updateStatus('error', '保存失败');
    }
}

async function loadMemories() {
    try {
        const { data, error } = await supabase
            .from('memories')
            .select('*')
            .order('memory_date', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const memoryList = document.getElementById('memoryList');
        memoryList.innerHTML = '';
        
        data.forEach(memory => {
            const memoryElement = createMemoryElement(memory);
            memoryList.appendChild(memoryElement);
        });
        
    } catch (error) {
        console.error('Error loading memories:', error);
        updateStatus('error', '加载回忆失败');
    }
}

function createMemoryElement(memory) {
    const div = document.createElement('div');
    div.className = 'memory-card';
    
    const memoryDate = new Date(memory.memory_date).toLocaleDateString('zh-CN');
    
    div.innerHTML = `
        <div class="memory-header">
            <h3 class="memory-title">${memory.title}</h3>
            <div class="memory-actions">
                <span class="memory-date">${memoryDate}</span>
                <button onclick="deleteMemory(${memory.id})" class="delete-btn">删除</button>
            </div>
        </div>
        <div class="memory-content">${memory.content}</div>
    `;
    
    return div;
}

async function deleteMemory(id) {
    if (!confirm('确定要删除这个回忆吗？')) return;
    
    try {
        updateStatus('connecting', '正在删除回忆...');
        
        const { error } = await supabase
            .from('memories')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadMemories();
        updateStatus('connected', '回忆删除成功');
        
    } catch (error) {
        console.error('Error deleting memory:', error);
        updateStatus('error', '删除失败');
    }
}

// 时间轴功能
function showTimelineForm() {
    document.getElementById('timelineModal').style.display = 'block';
}

function closeTimelineForm() {
    document.getElementById('timelineModal').style.display = 'none';
    // 清空表单
    document.getElementById('timelineDate').value = '';
    document.getElementById('timelineTitle').value = '';
    document.getElementById('timelineContent').value = '';
}

async function addTimelineEvent() {
    const date = document.getElementById('timelineDate').value;
    const title = document.getElementById('timelineTitle').value.trim();
    const content = document.getElementById('timelineContent').value.trim();
    
    if (!date) {
        alert('请选择日期！');
        return;
    }
    
    if (!title) {
        alert('请输入事件标题！');
        return;
    }
    
    if (!content) {
        alert('请描述这个特别的时刻！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在保存时间轴事件...');
        
        const { data, error } = await supabase
            .from('timeline_events')
            .insert([
                {
                    event_date: date,
                    title: title,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ])
            .select(); // 添加select()以获取插入的数据
        
        if (error) {
            throw error;
        }
        
        console.log('时间轴事件添加成功:', data);
        
        closeTimelineForm();
        await loadTimelineEvents();
        updateStatus('connected', '时间轴事件保存成功');
        
        // 滚动到时间轴区域
        document.getElementById('timeline').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
    } catch (error) {
        console.error('Error adding timeline event:', error);
        updateStatus('error', '保存失败: ' + error.message);
    }
}

async function loadTimelineEvents() {
    try {
        const { data, error } = await supabase
            .from('timeline_events')
            .select('*')
            .order('event_date', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        const timeline = document.querySelector('.timeline');
        
        // 清除所有动态添加的时间轴项目
        const dynamicItems = timeline.querySelectorAll('.timeline-item.dynamic');
        dynamicItems.forEach(item => item.remove());
        
        // 添加新的动态时间轴事件
        if (data && data.length > 0) {
            data.forEach((event, index) => {
                const eventElement = createTimelineElement(event, index);
                timeline.appendChild(eventElement);
            });
        }
        
        console.log('Timeline events loaded:', data?.length || 0);
        
    } catch (error) {
        console.error('Error loading timeline events:', error);
        // 如果表不存在，静默处理
        if (error.code !== 'PGRST116') {
            updateStatus('error', '加载时间轴失败');
        }
    }
}

function createTimelineElement(event, index) {
    const div = document.createElement('div');
    div.className = 'timeline-item dynamic';
    
    // 格式化日期
    const eventDate = new Date(event.event_date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // 确保内容不为空
    const title = event.title || '无标题';
    const content = event.content || '暂无描述';
    
    div.innerHTML = `
        <div class="timeline-date">${eventDate}</div>
        <div class="timeline-content">
            <h3>${title}</h3>
            <p>${content}</p>
            <button onclick="deleteTimelineEvent(${event.id})" class="delete-btn" style="margin-top: 1rem;">删除</button>
        </div>
    `;
    
    // 强制触发重绘以确保显示
    setTimeout(() => {
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    }, 50);
    
    return div;
}

async function deleteTimelineEvent(id) {
    if (!confirm('确定要删除这个时间轴事件吗？')) return;
    
    try {
        updateStatus('connecting', '正在删除事件...');
        
        const { error } = await supabase
            .from('timeline_events')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadTimelineEvents();
        updateStatus('connected', '事件删除成功');
        
    } catch (error) {
        console.error('Error deleting timeline event:', error);
        updateStatus('error', '删除失败');
    }
}

// 我们的娃（史迪仔展板）功能
async function addDoll() {
    const name = document.getElementById('dollName').value.trim();
    const purchaseDate = document.getElementById('dollPurchaseDate').value;
    const description = document.getElementById('dollDescription').value.trim();
    const fileInput = document.getElementById('dollImageInput');
    
    if (!name) {
        alert('请输入娃娃名称！');
        return;
    }
    
    if (!purchaseDate) {
        alert('请选择购入日期！');
        return;
    }
    
    if (!fileInput.files[0]) {
        alert('请选择娃娃照片！');
        return;
    }
    
    try {
        updateStatus('connecting', '正在添加娃娃...');
        
        const file = fileInput.files[0];
        
        // 清理文件名：移除中文字符、空格和特殊字符
        const cleanFileName = file.name
            .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
            .replace(/\s+/g, '_') // 空格替换为下划线
            .replace(/[^a-zA-Z0-9._-]/g, '') // 移除其他特殊字符
            .toLowerCase(); // 转为小写
        
        const fileName = `doll_${Date.now()}_${cleanFileName}`;
        
        console.log('原始文件名:', file.name);
        console.log('清理后文件名:', fileName);
        
        // 上传文件到 Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('dolls')
            .upload(fileName, file);
        
        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }
        
        console.log('照片上传成功:', uploadData);
        
        // 获取公共 URL
        const { data: urlData } = supabase.storage
            .from('dolls')
            .getPublicUrl(fileName);
        
        console.log('获取照片URL:', urlData.publicUrl);
        
        // 保存娃娃信息到数据库
        const { data, error } = await supabase
            .from('dolls')
            .insert([
                {
                    name: name,
                    purchase_date: purchaseDate,
                    description: description || '可爱的史迪仔娃娃',
                    image_url: urlData.publicUrl,
                    filename: fileName,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) {
            console.error('Database insert error:', error);
            throw error;
        }
        
        console.log('娃娃信息保存成功:', data);
        
        // 清空表单
        document.getElementById('dollName').value = '';
        document.getElementById('dollPurchaseDate').value = '';
        document.getElementById('dollDescription').value = '';
        fileInput.value = '';
        
        // 重新加载娃娃
        await loadDolls();
        updateStatus('connected', '娃娃添加成功');
        
        // 滚动到娃娃展板区域
        document.getElementById('dolls').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
    } catch (error) {
        console.error('Error adding doll:', error);
        updateStatus('error', '添加娃娃失败: ' + error.message);
    }
}

async function loadDolls() {
    try {
        console.log('开始加载娃娃数据...');
        
        const { data, error } = await supabase
            .from('dolls')
            .select('*')
            .order('purchase_date', { ascending: true }); // 按购入时间顺序排列
        
        if (error) {
            console.error('Load dolls error:', error);
            throw error;
        }
        
        console.log('娃娃数据加载结果:', data);
        
        const dollGrid = document.getElementById('dollGrid');
        if (!dollGrid) {
            console.error('找不到dollGrid元素');
            return;
        }
        
        dollGrid.innerHTML = '';
        
        if (!data || data.length === 0) {
            console.log('没有娃娃数据，显示空状态');
            // 显示空状态
            dollGrid.innerHTML = `
                <div class="doll-empty-state">
                    <h3>🧸 还没有收藏娃娃</h3>
                    <p>快来添加你们的第一个史迪仔娃娃吧！</p>
                </div>
            `;
            return;
        }
        
        console.log(`开始渲染${data.length}个娃娃`);
        
        data.forEach((doll, index) => {
            const dollElement = createDollElement(doll, index + 1);
            dollGrid.appendChild(dollElement);
        });
        
        console.log('娃娃渲染完成');
        
    } catch (error) {
        console.error('Error loading dolls:', error);
        // 如果表不存在，显示提示信息
        const dollGrid = document.getElementById('dollGrid');
        if (dollGrid) {
            if (error.code === 'PGRST116') {
                dollGrid.innerHTML = `
                    <div class="doll-empty-state">
                        <h3>🛠️ 数据库表未创建</h3>
                        <p>请先在数据库中创建dolls表和dolls存储桶</p>
                    </div>
                `;
            } else {
                dollGrid.innerHTML = `
                    <div class="doll-empty-state">
                        <h3>❌ 加载失败</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }
}

function createDollElement(doll, order) {
    const div = document.createElement('div');
    div.className = 'doll-card';
    
    const purchaseDate = new Date(doll.purchase_date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const description = doll.description || '可爱的史迪仔娃娃';
    
    div.innerHTML = `
        <div class="doll-image-container">
            <img src="${doll.image_url}" alt="${doll.name}" onclick="viewDoll('${doll.image_url}', '${doll.name}', '${purchaseDate}', '${description}')">
            <div class="doll-purchase-badge">${purchaseDate}</div>
        </div>
        <div class="doll-info">
            <div class="doll-header">
                <h3 class="doll-name">${doll.name}</h3>
                <div class="doll-actions">
                    <button onclick="deleteDoll(${doll.id}, '${doll.filename}')" class="delete-btn">删除</button>
                </div>
            </div>
            <div class="doll-date">${purchaseDate}</div>
            <div class="doll-description">${description}</div>
            <div class="doll-stats">
                <span class="doll-order">第 ${order} 个娃娃</span>
                <span style="color: #74b9ff; font-size: 0.8rem;">🧸 史迪仔家族</span>
            </div>
        </div>
    `;
    
    return div;
}

function viewDoll(imageUrl, name, purchaseDate, description) {
    const modal = document.createElement('div');
    modal.className = 'doll-modal';
    modal.onclick = () => modal.remove();
    
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageUrl}" alt="${name}">
            <div class="doll-modal-info">
                <h3>${name}</h3>
                <p><strong>购入日期：</strong>${purchaseDate}</p>
                <p><strong>描述：</strong>${description}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function deleteDoll(id, filename) {
    if (!confirm('确定要删除这个娃娃吗？删除后无法恢复！')) return;
    
    try {
        updateStatus('connecting', '正在删除娃娃...');
        
        // 删除 Storage 中的文件
        const { error: storageError } = await supabase.storage
            .from('dolls')
            .remove([filename]);
        
        if (storageError) {
            console.warn('Storage delete warning:', storageError);
        }
        
        // 删除数据库记录
        const { error } = await supabase
            .from('dolls')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadDolls();
        updateStatus('connected', '娃娃删除成功');
        
    } catch (error) {
        console.error('Error deleting doll:', error);
        updateStatus('error', '删除失败');
    }
}

// 导出数据时包含娃娃数据
async function exportData() {
    try {
        updateStatus('connecting', '正在导出数据...');
        
        // 获取所有数据
        const [messagesResult, photosResult, memoriesResult, moodsResult, timelineResult, dollsResult] = await Promise.all([
            supabase.from('messages').select('*').order('created_at', { ascending: false }),
            supabase.from('photos').select('*').order('created_at', { ascending: false }),
            supabase.from('memories').select('*').order('memory_date', { ascending: false }),
            supabase.from('moods').select('*').order('created_at', { ascending: false }),
            supabase.from('timeline_events').select('*').order('event_date', { ascending: true }),
            supabase.from('dolls').select('*').order('purchase_date', { ascending: true })
        ]);
        
        const exportData = {
            messages: messagesResult.data || [],
            photos: photosResult.data || [],
            memories: memoriesResult.data || [],
            moods: moodsResult.data || [],
            timeline_events: timelineResult.data || [],
            dolls: dollsResult.data || [],
            export_date: new Date().toISOString(),
            export_note: '郭佳仑 ❤️ 钱海宁 - 爱的记录数据备份（包含娃娃收藏）'
        };
        
        // 创建下载链接
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `love-memory-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        updateStatus('connected', '数据导出成功');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        updateStatus('error', '数据导出失败');
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('timelineModal');
    if (event.target === modal) {
        closeTimelineForm();
    }
} 
