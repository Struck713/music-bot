import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../lib/command";
import { Embeds } from "../../utils/embeds";
import Time from "../../utils/time";
import { Text } from "../../utils/misc";
import { VoiceTable, db } from "../../lib/database";
import { sql } from "kysely";
import youtube from "../../utils/youtube";
import axios from "axios";

interface VoiceTrendData {
    count: number;
    date: string;
}

export default <Command>{
    metadata: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows the stats for a specific type')
        .addStringOption(option => option.setName('type')
            .addChoices(...[ { name: "voice", value: "voice" }, { name: "meme", value: "meme" } ])
            .setRequired(true)
            .setDescription('The type of stats to show')),
    execute: async (_, user, interaction) => {

        const type = interaction.options.getString("type", true);

        if (type === "voice") {
            const recent = await db.selectFrom("voice")
                .selectAll()
                .orderBy("created desc")
                .limit(1)
                .execute()
                .then(rows => rows[0])
                .catch(_ => null);

            const data = await sql`SELECT COUNT(*) count, DATE(created) date FROM ${sql.table("voice")} GROUP BY date ORDER BY date DESC LIMIT 15`
                .execute(db)
                .then(data => data.rows.map((row: any) => 
                    <VoiceTrendData>{ 
                        count: row.count, 
                        date: row.date 
                    }))
                .catch(_ => null);

            if (!data || !recent) {
                await Embeds.error(interaction, "Failed to voice statistic data!");
                return;
            }

            const labels = data.map(row => row.date);
            const counts = data.map(row => row.count);
            const chart = JSON.stringify({
                type: 'line',
                data: {
                  labels,
                  datasets: [
                    {
                      label: 'Songs Played',
                      data: counts,
                    },
                  ],
                },
            });

            const peak = data.reduce((prev, curr) => prev.count >= curr.count ? prev : curr);
            const playedRecently = counts.reduce((prev, curr) => prev + curr);
            const playedToday = counts[0];

            await Embeds.create()
                // .setTitle("Voice Statistics")
                .setAuthor({ name: `${Text.number(playedRecently, "song")} have been played recently.` })
                .addFields([
                    { name: "Most recent song", value: recent.video_name, inline: false },
                    { name: "Songs played today", value: Text.number(playedToday, "song"), inline: true },
                    { name: "Songs played at peak", value: `${Text.number(peak.count, "song")} on ${peak.date}`, inline: true },
                ])
                .setImage(`https://quickchart.io/chart?c=${encodeURIComponent(chart)}`)
                .send(interaction);
            return;
        }

        await Embeds.error(interaction, `Stats for \`${type}\` are not implemented yet.`);
    },
}