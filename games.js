// 游戏管理器
const GameManager = {
  games: [],
  currentPage: 1,
  gamesPerPage: 50,
  currentView: 'all',
  favorites: new Set(),
  searchTerm: '',

  // 初始化
  init: async function () {
    await this.loadGames();
    this.loadFavorites();
    this.setupEventListeners();
    this.renderGames();
  },

  // 加载游戏列表
  loadGames: async function () {
    try {
      // 获取目录列表
      const response = await fetch('all-roms/');
      const text = await response.text();

      // 使用正则表达式匹配所有 .nes 和 .png 文件
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));

      // 获取所有 .nes 和 .png 文件
      const nesFiles = new Set();
      const pngFiles = new Set();

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          if (href.toLowerCase().endsWith('.nes')) {
            nesFiles.add(href);
          } else if (href.toLowerCase().endsWith('.png')) {
            pngFiles.add(href);
          }
        }
      });

      this.games = Array.from(nesFiles).map(filename => {
        // 检查是否有对应的预览图
        const pngFilename = filename.slice(0, -4) + '.png';
        const hasPreview = pngFiles.has(pngFilename);

        // 从文件名生成游戏标题
        let title = filename.slice(0, -4)  // 移除 .nes 后缀
          .replace(/[\(\[].*?[\)\]]/g, '')  // 移除括号内的内容
          .replace(/[_\-\.]/g, ' ')  // 替换下划线、横线和点为空格
          .replace(/\s+/g, ' ')  // 合并多个空格
          .trim();  // 移除首尾空格

        // 如果标题是空的，使用文件名
        if (!title) {
          title = filename.slice(0, -4);
        }

        // 根据文件名特征判断游戏类别
        let category = '未分类';
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.includes('mario') || lowerFilename.includes('contra') || lowerFilename.includes('ninja') || lowerFilename.includes('adventure')) {
          category = '动作冒险';
        } else if (lowerFilename.includes('fight') || lowerFilename.includes('combat') || lowerFilename.includes('gun')) {
          category = '射击格斗';
        } else if (lowerFilename.includes('tetris') || lowerFilename.includes('puzzle') || lowerFilename.includes('doctor') || lowerFilename.includes('mahjong')) {
          category = '休闲益智';
        } else if (lowerFilename.includes('rpg') || lowerFilename.includes('dragon') || lowerFilename.includes('final') || lowerFilename.includes('fantasy')) {
          category = '角色扮演';
        } else if (lowerFilename.includes('race') || lowerFilename.includes('sport') || lowerFilename.includes('tennis') || lowerFilename.includes('golf')) {
          category = '竞速体育';
        }

        return {
          id: filename,
          title: title,
          category: category,
          filename: filename,
          preview: hasPreview ? `all-roms/${pngFilename}` : null
        };
      });

      // 按标题排序
      this.games.sort((a, b) => a.title.localeCompare(b.title));

    } catch (error) {
      console.error('Error loading games:', error);
      this.games = [];
    }
  },

  // 加载收藏
  loadFavorites: function () {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      this.favorites = new Set(JSON.parse(saved));
    }
  },

  // 保存收藏
  saveFavorites: function () {
    localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
  },

  // 切换收藏状态
  toggleFavorite: function (gameId) {
    if (this.favorites.has(gameId)) {
      this.favorites.delete(gameId);
    } else {
      this.favorites.add(gameId);
    }
    this.saveFavorites();
    this.renderGames();
  },

  // 设置事件监听
  setupEventListeners: function () {
    // 搜索输入框
    const searchInput = document.getElementById('game-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.renderGames();
      });
    }

    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelector('.nav-btn.active').classList.remove('active');
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.currentPage = 1;
        this.renderGames();
      });
    });

    // 分页按钮
    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderGames();
      }
    });

    document.getElementById('next-page').addEventListener('click', () => {
      const filteredGames = this.getFilteredGames();
      const maxPage = Math.ceil(filteredGames.length / this.gamesPerPage);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderGames();
      }
    });
  },

  // 获取过滤后的游戏列表
  getFilteredGames: function () {
    let filtered = this.games;

    // 收藏视图过滤
    if (this.currentView === 'favorites') {
      filtered = filtered.filter(game => this.favorites.has(game.id));
    }

    // 搜索过滤
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(term) ||
        game.filename.toLowerCase().includes(term)
      );
    }

    return filtered;
  },

  // 渲染游戏列表
  renderGames: function () {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '<div class="loading"></div>';

    const filteredGames = this.getFilteredGames();
    const start = (this.currentPage - 1) * this.gamesPerPage;
    const end = start + this.gamesPerPage;
    const pageGames = filteredGames.slice(start, end);

    // 更新分页信息
    const maxPage = Math.ceil(filteredGames.length / this.gamesPerPage);
    document.getElementById('prev-page').disabled = this.currentPage === 1;
    document.getElementById('next-page').disabled = this.currentPage === maxPage;
    document.getElementById('page-info').textContent =
      `第 ${this.currentPage} / ${maxPage || 1} 页 (共 ${filteredGames.length} 个游戏)`;

    // 渲染游戏卡片
    if (pageGames.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>${this.currentView === 'favorites' ? '还没有收藏任何游戏' :
          (this.searchTerm ? `没有找到与 "${this.searchTerm}" 相关的游戏` : '没有找到相关游戏')}
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = pageGames.map(game => `
      <div class="game-card" data-id="${game.id}">
        ${game.preview ? `<img src="${game.preview}" alt="${game.title}" loading="lazy">` : ''}
        <div class="game-info">
          <div class="game-title">${game.title}</div>
          <div class="game-category">${game.category}</div>
          <div class="game-filename">${game.filename}</div>
        </div>
        <button class="favorite-btn ${this.favorites.has(game.id) ? 'active' : ''}"
                onclick="GameManager.toggleFavorite('${game.id}')">
          ❤
        </button>
      </div>
    `).join('');

    // 添加游戏卡片点击事件
    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-btn')) {
          const gameId = card.dataset.id;
          window.location.href = `play.html?game=${encodeURIComponent(gameId)}`;
        }
      });
    });
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  GameManager.init();
}); 