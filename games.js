// 游戏管理器
const GameManager = {
  games: [],
  currentPage: 1,
  gamesPerPage: 48, // 8行6列 = 48个游戏/页
  currentView: "all",
  favorites: new Set(),
  searchTerm: "",

  // 初始化
  init: async function () {
    await this.loadGames();
    this.loadFavorites();

    // 检查是否有返回页面信息
    const returnPage = sessionStorage.getItem("returnPage");
    if (returnPage) {
      this.currentPage = parseInt(returnPage, 10);
      sessionStorage.removeItem("returnPage");
    }

    this.setupEventListeners();
    this.renderGames();
  },

  // 加载游戏列表
  loadGames: async function () {
    try {
      // 从 games-list.json 加载游戏数据
      const response = await fetch("games-list.json");
      const data = await response.json();

      this.games = data.games.map((game) => ({
        id: game.id,
        title: game.title,
        category: game.category,
        filename: game.id,
        preview: game.hasPreview
          ? `all-roms/${game.id.replace(".nes", ".png")}`
          : null,
      }));

      // 按标题排序
      this.games.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      console.error("Error loading games:", error);
      this.games = [];
    }
  },

  // 加载收藏
  loadFavorites: function () {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      this.favorites = new Set(JSON.parse(saved));
    }
  },

  // 保存收藏
  saveFavorites: function () {
    localStorage.setItem("favorites", JSON.stringify([...this.favorites]));
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
    const searchInput = document.getElementById("game-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.renderGames();
      });
    }

    // 导航按钮
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelector(".nav-btn.active").classList.remove("active");
        btn.classList.add("active");
        this.currentView = btn.dataset.view;
        this.currentPage = 1;
        this.renderGames();
      });
    });

    // 分页按钮
    document.getElementById("prev-page").addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderGames();
      }
    });

    document.getElementById("next-page").addEventListener("click", () => {
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
    if (this.currentView === "favorites") {
      filtered = filtered.filter((game) => this.favorites.has(game.id));
    }

    // 搜索过滤
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(term) ||
          game.filename.toLowerCase().includes(term)
      );
    }

    return filtered;
  },

  // 渲染游戏列表
  renderGames: function () {
    const grid = document.getElementById("game-grid");
    grid.innerHTML = '<div class="loading"></div>';

    const filteredGames = this.getFilteredGames();
    const start = (this.currentPage - 1) * this.gamesPerPage;
    const end = start + this.gamesPerPage;
    const pageGames = filteredGames.slice(start, end);

    // 更新分页信息
    const maxPage = Math.ceil(filteredGames.length / this.gamesPerPage);
    document.getElementById("prev-page").disabled = this.currentPage === 1;
    document.getElementById("next-page").disabled =
      this.currentPage === maxPage;
    document.getElementById("page-info").textContent = `第 ${
      this.currentPage
    } / ${maxPage || 1} 页 (共 ${filteredGames.length} 个游戏)`;

    // 渲染游戏卡片
    if (pageGames.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>${
            this.currentView === "favorites"
              ? "还没有收藏任何游戏"
              : this.searchTerm
              ? `没有找到与 "${this.searchTerm}" 相关的游戏`
              : "没有找到相关游戏"
          }
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = pageGames
      .map(
        (game) => `
      <div class="game-card" data-id="${game.id}">
        ${
          game.preview
            ? `<img src="${game.preview}" alt="${game.title}" loading="lazy">`
            : ""
        }
        <div class="game-info">
          <div class="game-title">${game.title}</div>
          <!-- 隐藏类别和文件名，但保留数据以供搜索 -->
          <div class="game-category" style="display: none;">${
            game.category
          }</div>
          <div class="game-filename" style="display: none;">${
            game.filename
          }</div>
        </div>
        <button class="favorite-btn"
                onclick="GameManager.toggleFavorite('${game.id}')">
          <span class="heart ${
            this.favorites.has(game.id) ? "active" : ""
          }"></span>
        </button>
      </div>
    `
      )
      .join("");

    // 添加游戏卡片点击事件
    grid.querySelectorAll(".game-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (
          !e.target.classList.contains("favorite-btn") &&
          !e.target.classList.contains("heart")
        ) {
          // 在跳转前存储当前页面信息
          sessionStorage.setItem("returnPage", this.currentPage);
          const gameId = card.dataset.id;
          // // 使用 noopener 打开新窗口,避免子页面影响父页面
          window.open(
            `play.html?game=${encodeURIComponent(gameId)}`,
            "_blank",
            "noopener"
          );
        }
      });
    });
  },
};

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  GameManager.init();
});
