import json
import os

# 读取现有的 games-list.json
with open('games-list.json', 'r', encoding='utf-8') as f:
    games_list = json.load(f)

# 获取现有游戏的 ID 列表
existing_game_ids = set(game['id'] for game in games_list['games'])

# 获取 all-roms 目录下所有的 .nes 文件和预览图
all_roms = [f for f in os.listdir('all-roms') if f.endswith('.nes')]
preview_images = set(os.path.splitext(f)[0] for f in os.listdir('all-roms') if f.endswith('.png'))

# 为新游戏添加条目
for rom in all_roms:
    if rom not in existing_game_ids:
        rom_id = os.path.splitext(rom)[0]
        new_game = {
            "id": rom,
            "title": f"游戏 {rom_id}",  # 临时标题
            "category": "未分类",
            "hasPreview": rom_id in preview_images
        }
        games_list['games'].append(new_game)

# 按 ID 排序
games_list['games'].sort(key=lambda x: x['id'])

# 保存更新后的文件
with open('games-list.json', 'w', encoding='utf-8') as f:
    json.dump(games_list, f, ensure_ascii=False, indent=2)

# 打印统计信息
print(f"Total games: {len(games_list['games'])}")
print(f"Uncategorized games: {sum(1 for game in games_list['games'] if game['category'] == '未分类')}")
