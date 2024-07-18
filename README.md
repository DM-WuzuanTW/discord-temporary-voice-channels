# Discord Voice Channel Manager

這是一個 Discord 機器人，用於管理語音頻道的創建和刪除。當用戶加入指定的語音頻道時，機器人會自動創建一個臨時語音頻道，並在無人使用該頻道後自動刪除它。

## 功能 | Features

- 當用戶加入指定的語音頻道時自動創建臨時語音頻道  
  Automatically create temporary voice channels when users join specified voice channels.
- 當臨時語音頻道無人使用時自動刪除  
  Automatically delete temporary voice channels when they are not in use.
- 記錄用戶創建語音頻道的次數，並在短時間內多次創建時發出警告  
  Record the number of times users create voice channels, issuing warnings if created multiple times within a short period.
- 自動將違規用戶禁言一段時間  
  Automatically mute users who violate rules for a specified duration.

## 安裝 | Installation

1. 下載這個存儲庫：  
   Clone this repository:
    ```sh
    git clone https://github.com/DM-WuzuanTW/discord-temporary-voice-channels/
    ```

2. 安裝依賴項目：  
   Install dependencies:
    ```sh
    npm install
    ```

3. 配置 `config.json` 文件：  
   Configure the `config.json` file:
    - `token`: 你的 Discord 機器人令牌 | Your Discord bot token
    - `VOICE_CHANNEL_ID`: 監聽的語音頻道 ID | The ID of the voice channel to monitor
    - `CATEGORY_ID`: 用於創建臨時語音頻道的分類 ID | The category ID for creating temporary voice channels
    - `LOG_CHANNEL_ID`: 日誌頻道 ID | The log channel ID
    - `CHAT_CHANNEL_ID`: 逞罰頻道 ID | The punish channel ID
    - `REASON`: 違規原因 | Reason for violation
    - `TIME`: 禁言時間 | Mute duration
    - `ROLE_INCREASES`: 特定角色的 ID 列表，這些角色允許增加用戶限制 | List of role IDs that allow increasing user limits
    - `CREATOR_PERMISSIONS`: 創建者的權限設置 | Creator permissions settings

4. 啟動機器人：  
   Start the bot:
    ```sh
    node .
    ```

## 使用 | Usage

啟動機器人後，當用戶加入配置的語音頻道時，機器人將自動創建一個臨時語音頻道。當該臨時語音頻道無人使用時，它將被自動刪除。  
After starting the bot, when a user joins the configured voice channel, the bot will automatically create a temporary voice channel. When the temporary voice channel is no longer in use, it will be automatically deleted.

## 配置示例 | Example Configuration

以下是一個 `config.json` 的示例配置：  
Here is an example configuration for `config.json`:

```json
{
    "token": "Discord Bot Token【Discord 機器人令牌】",
    "VOICE_CHANNEL_ID": "Voice Channel ID【語音頻道ID】",
    "CATEGORY_ID": "Category ID【分類ID】",
    "LOG_CHANNEL_ID": "Log Channel ID【日誌頻道ID】",
    "CHAT_CHANNEL_ID": "punish Channel ID【逞罰頻道ID】",
    "REASON": "reason for violation【違規原因】",
    "TIME": "Reset user creation counter used for limiting operation frequency【重設使用者創建計數器，用於限制操作頻率】",
    "ROLE_INCREASES": ["RoleID 【身分組ID】"],
    "CREATOR_PERMISSIONS": {
        "allow": [
            "CONNECT",
            "VIEW_CHANNEL",
            "MANAGE_CHANNELS",
            "MANAGE_ROLES",
            "MOVE_MEMBERS",
            "MUTE_MEMBERS",
            "DEAFEN_MEMBERS",
            "MANAGE_WEBHOOKS"
        ]
    }
}
```
## 版權所有 | License

[版權所有 © 2024 輻能冒險。保留所有權利。](https://discord.gg/ZgaEZCH8wr)

---

### Copyright | License

[Copyright © 2024 輻能冒險. All rights reserved.](https://discord.gg/ZgaEZCH8wr)
