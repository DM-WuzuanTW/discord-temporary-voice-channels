const { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { token, VOICE_CHANNEL_ID, CATEGORY_ID, LOG_CHANNEL_ID, CHAT_CHANNEL_ID ,TIME,REASON} = require('../config.json');
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
        console.error(`找不到 log 頻道：${LOG_CHANNEL_ID}`);
    }
}

setInterval(resetUserCreateCount, 60000);

function logToChannel(message) {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        logChannel.send(message);
    } else {
        console.error(`找不到 log 頻道：${LOG_CHANNEL_ID}`);
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
                        .setTitle('警告')
                        .setDescription(`<@${userId}> 在短時間內建立了多個語音頻道！`)
                        .addFields(
                            { name: "違規次數", value: `${userCreateCount[userId].count}`, inline: true },
                            { name: "發布時間", value: formattedTime, inline: true }
                        )
                        .setImage(guild.iconURL({ dynamic: true, size: 64 }));
                    chatChannel.send({ embeds: [embed] });
                }

                // 檢查 Bot 是否有權限對成員進行 timeout 操作
                if (guild.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    try {
                        await newState.member.timeout(TIME, REASON);
                        console.log(`成員 ${userId} 已被 timeout`);
                    } catch (error) {
                        console.error(`無法對成員 ${userId} 進行 timeout 操作:`, error);
                    }
                } else {
                    console.error(`Bot 沒有 MODERATE_MEMBERS 權限`);
                }
            }

            guild.channels.create({
                name: '臨時-' + newState.member.displayName,
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
                ],
            }).then(channel => {
                let userLimit = 50;

                const roleIncreases = [
                    '1249170994644652072', '1249170990827831318', '1249170986839052349', '1249170983433015367',
                    '1249170979540832400', '1249170976072269955', '1249170972792061972', '1249170968711266304',
                    '1249170963812323362', '1249170960439836693', '1249170957126471760', '1249170953225895967',
                    '1249170948679270562', '1249170944300286022', '1249170940408107058', '1249170936494559316',
                    '1249170932577337344', '1249170929234477170', '1249170925086183464', '1249170921340534865',
                    '1249170917905666108', '1249170913803374633', '1249170910305325106', '1249170905993838684',
                    '1249170902017642638', '1249170898787893361', '1145174048502984755'
                ];

                roleIncreases.forEach(role => {
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
                    logToChannel(`建立了新的語音頻道：${channel.name}`);
                    console.log(`建立了新的語音頻道：${channel.name}`);

                    const voiceStateUpdateListener = (oldState, newState) => {
                        if (channel.members.size === 0) {
                            channel.delete().then(() => {
                                logToChannel(`刪除了空的語音頻道：${channel.name}`);
                                console.log(`刪除了空的語音頻道：${channel.name}`);
                                channel.client.off('voiceStateUpdate', voiceStateUpdateListener);
                            }).catch(console.error);
                        }
                    };
                    channel.client.on('voiceStateUpdate', voiceStateUpdateListener);
                } else {
                    console.log(`${newState.member.id} 已經不在語音頻道中`);
                }
            }).catch(console.error);
        }
    }
});



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(resetUserCreateCount, 60000);
});

client.login(token);
