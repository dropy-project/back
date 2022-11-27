/* eslint-disable prettier/prettier */
import webhook from 'webhook-discord';


export function webhookError(routeName: string, username: string | null, error: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_ERROR;

  if (webhookUrl != undefined) {
    const hook = new webhook.Webhook(webhookUrl);
    
    const msg = new webhook.MessageBuilder()
    .setAuthor(`User : ${username == null ? 'Unknown' : username}`)
    .setName(routeName)
    .setDescription(error)
    .setColor('#DC454B')
    .setTime();
    
    hook.send(msg);
  }
}
