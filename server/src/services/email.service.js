import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Assignment } from '../models/Assignment.js';
import { Enrollment } from '../models/Enrollment.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';

let transporterPromise = null;
let usingEthereal = false;

/** Lazily create a transporter (real SMTP if configured, else Ethereal test inbox). */
async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (env.email.host && env.email.user) {
      return nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.port === 465,
        auth: { user: env.email.user, pass: env.email.pass },
      });
    }
    // Dev fallback: Ethereal (messages are captured, not delivered).
    const test = await nodemailer.createTestAccount();
    usingEthereal = true;
    console.log('📧 Email using Ethereal test inbox (preview links logged on send).');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
  })();
  return transporterPromise;
}

async function send({ to, subject, html, text }) {
  if (!to) return null;
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.email.from, to, subject, html, text });
  if (usingEthereal) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log(`📧 Sent "${subject}" to ${to} — preview: ${url}`);
  }
  return info;
}

const shell = (title, body) =>
  `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
    <div style="background:linear-gradient(135deg,#38bdf8,#2563eb);padding:20px;border-radius:14px 14px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">AI LMS</h1>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${body}
    </div>
  </div>`;

/** Welcome email when a student enrolls (fire-and-forget). */
export async function sendEnrollmentEmail(studentId, courseId) {
  const [user, course] = await Promise.all([
    User.findById(studentId).select('name email').lean(),
    Course.findById(courseId).select('title').lean(),
  ]);
  if (!user?.email || !course) return;
  await send({
    to: user.email,
    subject: `You're enrolled in ${course.title}`,
    text: `Hi ${user.name}, you're enrolled in "${course.title}". Happy learning!`,
    html: shell(
      `Welcome aboard, ${user.name}! 🎉`,
      `<p>You're now enrolled in <b>${course.title}</b>.</p>
       <p>Jump in and start learning whenever you're ready.</p>`
    ),
  });
}

/** Reminder for an upcoming assignment due date. */
async function sendDueReminder(user, assignment, courseTitle) {
  await send({
    to: user.email,
    subject: `Reminder: "${assignment.title}" is due soon`,
    text: `Hi ${user.name}, your assignment "${assignment.title}" in ${courseTitle} is due ${new Date(assignment.dueDate).toLocaleString()}.`,
    html: shell(
      `Assignment due soon ⏰`,
      `<p>Hi ${user.name},</p>
       <p>Your assignment <b>${assignment.title}</b> in <b>${courseTitle}</b> is due
       <b>${new Date(assignment.dueDate).toLocaleString()}</b>.</p>
       <p>Don't forget to submit on time!</p>`
    ),
  });
}

/**
 * Find assignments due in the next 24h and email enrolled students who haven't
 * submitted yet. Returns the number of reminders sent.
 */
export async function checkAndSendReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const assignments = await Assignment.find({ dueDate: { $gte: now, $lte: soon } })
    .populate('course', 'title')
    .lean();

  let sent = 0;
  for (const a of assignments) {
    if (!a.course) continue;
    const enrollments = await Enrollment.find({ course: a.course._id })
      .populate('student', 'name email')
      .lean();
    for (const e of enrollments) {
      if (!e.student?.email) continue;
      const submitted = await Submission.exists({ assignment: a._id, student: e.student._id });
      if (submitted) continue;
      await sendDueReminder(e.student, a, a.course.title).catch(() => {});
      sent++;
    }
  }
  return sent;
}
