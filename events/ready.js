// events/ready.js
export const name = 'ready';
export const once = true;

export function execute(client) {
  console.log(`✅ Logged in as ${client.user.tag}!`);
}