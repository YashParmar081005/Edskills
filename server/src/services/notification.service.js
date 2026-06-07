import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/index.js';

/**
 * Create a notification and push it to the recipient in real time.
 * No-ops if the recipient is the actor (don't notify yourself).
 *
 * @param {object} o
 * @param {string|ObjectId} o.user   recipient
 * @param {string} o.type            'thread' | 'reply' | 'answer' | 'system'
 * @param {string} o.message
 * @param {string} [o.link]
 * @param {string|ObjectId} [o.actor]
 */
export async function notify({ user, type, message, link = '', actor }) {
  if (!user) return null;
  if (actor && String(actor) === String(user)) return null;

  const notification = await Notification.create({ user, type, message, link, actor });
  emitToUser(user, 'notification:new', notification);
  return notification;
}
