const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const TOKEN = 'DISCORD_BOT_TOKEN';
const SERVER_ID = 'DISCORD_SERVER_ID';

// Map Slack IDs to Discord channel IDs
const CHANNEL_MAP = {
  'slack_channel_1': 'discord_channel_1',
  'slack_channel_2': 'discord_channel_2',
  'slack_channel_3': 'discord_channel_3',
};

client.once('ready', async () => {
  console.log(`Bot connected as ${client.user.tag}`);

  // Get the server
  const guild = client.guilds.cache.get(SERVER_ID);
  if (!guild) {
    console.error('Server not found! Check the SERVER_ID.');
    return;
  }

  // Iterate over the mapped channels
  for (const slackChannel in CHANNEL_MAP) {
    const discordChannelId = CHANNEL_MAP[slackChannel];
    const discordChannel = guild.channels.cache.get(discordChannelId);

    if (!discordChannel) {
      console.error(`Discord channel not found for: ${slackChannel}`);
      continue;
    }

    console.log(`Importing messages to channel: ${discordChannel.name}`);

    // Path to the Slack folder
    const slackFolder = `./slack_exports/${slackChannel}`;
    if (!fs.existsSync(slackFolder)) {
      console.error(`Slack export folder not found: ${slackFolder}`);
      continue;
    }

    // List all files in the folder
    const files = fs.readdirSync(slackFolder).filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(slackFolder, file);

      // Read and process the JSON file
      const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const message of messages) {
        const text = message.text || '[Empty message]';
        const timestamp = new Date(parseFloat(message.ts) * 1000).toLocaleString();
        const userName = message.user_profile?.real_name || "Unknown User";

        try {
          await discordChannel.send(`**[${timestamp}]** ${userName}: ${text}`);
          console.log(`Message sent: ${text}`);
        } catch (error) {
          console.error(`Error sending message in channel ${discordChannel.name}: ${error.message}`);
        }
      }
    }
  }

  console.log('Import completed!');
  process.exit();
});

client.login(TOKEN);
