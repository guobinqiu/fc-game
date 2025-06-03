import json
import os

# 读取现有的 games-list.json
with open('games-list.json', 'r', encoding='utf-8') as f:
    games_list = json.load(f)

# 创建一个已分类游戏的字典，用于保存已有的中文标题和分类
existing_games = {}
for game in games_list['games']:
    if game['category'] != '未分类' and not game['title'].startswith('游戏 '):
        existing_games[game['id']] = {
            'title': game['title'],
            'category': game['category']
        }

# 获取 all-roms 目录下所有的 .nes 文件和预览图
all_roms = [f for f in os.listdir('all-roms') if f.endswith('.nes')]
# 将文件名转换为数字进行排序
all_roms.sort(key=lambda x: int(os.path.splitext(x)[0]))
preview_images = set(os.path.splitext(f)[0] for f in os.listdir('all-roms') if f.endswith('.png'))

# 重置游戏列表
games_list['games'] = []

# 处理所有游戏
for rom in all_roms:
    # 获取不带后缀的文件名作为标题
    title = os.path.splitext(rom)[0]
    
    # 添加游戏条目
    rom_id = os.path.splitext(rom)[0]
    game = {
        "id": rom,
        "title": title,
        "category": "未分类",
        "hasPreview": rom_id in preview_images
    }
    games_list['games'].append(game)

# 按 ID 排序
games_list['games'].sort(key=lambda x: x['id'])

# 只保留 games 字段
final_json = {"games": games_list['games']}

# 保存更新后的文件
with open('games-list.json', 'w', encoding='utf-8') as f:
    json.dump(final_json, f, ensure_ascii=False, indent=2)

# 打印统计信息
print(f"Total games: {len(games_list['games'])}")
print(f"Uncategorized games: {sum(1 for game in games_list['games'] if game['category'] == '未分类')}")
