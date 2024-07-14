const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

const { token, VOICE_CHANNEL_ID, CATEGORY_ID, LOG_CHANNEL_ID, CHAT_CHANNEL_ID, TIME, REASON, ROLE_INCREASES, CREATOR_PERMISSIONS } = config;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

const userCreateCount = {};

function resetUserCreateCount() {
    for (const userId in userCreateCount) {
        if (userCreateCount.hasOwnProperty(userId)) {
            const userData = userCreateCount[userId];
            if (Date.now() - userData.lastTime >= 60000) {
                userData.count = 0;
                userData.lastTime = Date.now();
            } else {
                const remainingSeconds = Math.ceil((userData.lastTime + 60000 - Date.now()) / 1000);
                logCountdown(userId, remainingSeconds, userData.count);

                if (remainingSeconds === 0) {
                    userData.count = 0;
                    userData.lastTime = Date.now();
                }
            }
        }
    }
}

function logCountdown(userId, seconds, count) {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        if (seconds >= 0) {
            setTimeout(() => {
                logChannel.messages.fetch({ limit: 1 }).then(messages => {
                    const lastMessage = messages.first();
                    if (lastMessage) {
                        lastMessage.edit(`${userId} \`${seconds}\``).then(() => {
                            if (seconds > 0) {
                                logCountdown(userId, seconds - 1, count);
                            }
                        }).catch(console.error);
                    }
                }).catch(console.error);
            }, 1000);
        }
    } else {
        console.error(`Cannot find log channel: ${LOG_CHANNEL_ID} 【找不到 log 頻道：${LOG_CHANNEL_ID}】`);
    }
}

setInterval(resetUserCreateCount, 60000);

function logToChannel(message) {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        logChannel.send(message);
    } else {
        console.error(`Cannot find log channel: ${LOG_CHANNEL_ID} 【找不到 log 頻道：${LOG_CHANNEL_ID}】`);
    }
}

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.channel && newState.channel.id === VOICE_CHANNEL_ID) {
        const guild = newState.guild;
        const category = guild.channels.cache.get(CATEGORY_ID);

        if (category && category.type === ChannelType.GuildCategory) {
            const userId = newState.member.id;
            const currentTime = Date.now();
            if (userCreateCount[userId]) {
                userCreateCount[userId].count++;
                userCreateCount[userId].lastTime = currentTime;
            } else {
                userCreateCount[userId] = {
                    count: 1,
                    lastTime: currentTime
                };
            }

            if (userCreateCount[userId].count >= 5 && currentTime - userCreateCount[userId].lastTime <= 60000) {
                const chatChannel = client.channels.cache.get(CHAT_CHANNEL_ID);
                const now = new Date();
                const formattedTime = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                if (chatChannel && chatChannel.type === ChannelType.GuildText) {
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Warning 警告')
                        .setDescription(`<@${userId}> created multiple voice channels in a short time! 【在短時間內建立了多個語音頻道！】`)
                        .addFields(
                            { name: "Violation Count 違規次數", value: `${userCreateCount[userId].count}`, inline: true },
                            { name: "Post Time 發布時間", value: formattedTime, inline: true }
                        )
                        .setImage(guild.iconURL({ dynamic: true, size: 64 }));
                    chatChannel.send({ embeds: [embed] });
                }

                
                if (guild.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    try {
                        await newState.member.timeout(TIME, REASON);
                        console.log(`Member ${userId} has been timed out【成員 ${userId} 已被 timeout】`);
                    } catch (error) {
                        console.error(`Unable to timeout member ${userId}: ${error} 【無法對成員 ${userId} 進行 timeout 操作: ${error}】`);
                    }
                } else {
                    console.error(`Bot does not have MODERATE_MEMBERS permission【Bot 沒有 MODERATE_MEMBERS 權限】`);
                }
            }

            guild.channels.create({
                name: 'Temporary-' + newState.member.displayName,
                type: ChannelType.GuildVoice,
                parent: category,
                permissionOverwrites: [
                    {
                        id: newState.member.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageRoles,
                            PermissionsBitField.Flags.MoveMembers,
                            PermissionsBitField.Flags.MuteMembers,
                            PermissionsBitField.Flags.DeafenMembers,
                            PermissionsBitField.Flags.ManageWebhooks
                        ],
                    },
                    {
                        id: '1145174048502984755',
                        allow: [PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: newState.guild.ownerId,
                        allow: CREATOR_PERMISSIONS.allow,
                    }
                ],
            }).then(channel => {
                let userLimit = 50;

                ROLE_INCREASES.forEach(role => {
                    if (newState.member.roles.cache.has(role)) {
                        userLimit += 3;
                    }
                });
                if (userLimit > 99) {
                    userLimit = 99;
                }
                channel.setUserLimit(userLimit);

                if (newState.member.voice.channel) {
                    newState.setChannel(channel).catch(console.error);
                    logToChannel(`Created new voice channel: ${channel.name} 【建立了新的語音頻道：${channel.name}`);
                    console.log(`Created new voice channel: ${channel.name} 【建立了新的語音頻道：${channel.name}`);

                    const voiceStateUpdateListener = (oldState, newState) => {
                        if (channel.members.size === 0) {
                            channel.delete().then(() => {
                                logToChannel(`Deleted empty voice channel: ${channel.name} 【刪除了空的語音頻道：${channel.name}`);
                                console.log(`Deleted empty voice channel: ${channel.name} 【刪除了空的語音頻道：${channel.name}`);
                            }).catch(console.error);
                        }
                    };

                    client.on('voiceStateUpdate', voiceStateUpdateListener);

                    setTimeout(() => {
                        if (channel && channel.deletable && channel.members.size === 0) {
                            channel.delete().then(() => {
                                logToChannel(`Deleted inactive voice channel: ${channel.name} 【刪除了無成員活動的語音頻道：${channel.name}`);
                                console.log(`Deleted inactive voice channel: ${channel.name} 【刪除了無成員活動的語音頻道：${channel.name}`);
                            }).catch(console.error);
                        }
                        client.removeListener('voiceStateUpdate', voiceStateUpdateListener);
                    }, 300000);
                } else {
                    channel.delete().catch(console.error);
                    logToChannel(`Channel created before member left: ${channel.name} 【成員離開前已建立的語音頻道：${channel.name}`);
                }
            }).catch(console.error);
        }
    }
});

client.once('ready', () => {
    console.log('Ready! 【準備好了！】');
});

client.login(token);
