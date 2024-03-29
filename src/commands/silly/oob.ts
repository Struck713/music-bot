import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../lib/command";
import { Embeds } from "../../utils/embeds";

export default <Command>{
    metadata: new SlashCommandBuilder()
        .setName('oobinate')
        .setDescription('Converts normal text into oob text.')
        .addStringOption(option => option.setName("text").setRequired(true).setDescription("The text to oobinate.")),
    execute: async (client, user, interaction) => {
        let text = interaction.options.get("text", true);
        await Embeds.create()
            .setTitle("Oobinator")
            .setDescription(`
                \`${(text.value as string).replace(/[aeiouAEIOU]/g, "oob")}\`
            `)
            .send(interaction);
    },
}