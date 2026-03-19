const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'services', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const writeJson = (name, data) => {
  fs.writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2));
};

const passwordHash = bcrypt.hashSync('password123', 10);
const now = new Date();
const minusDays = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const sections = [
  { _id: 'sec-academics', name: 'Academics', subSections: ['CS', 'AIML', 'ECE'] },
  { _id: 'sec-hostel', name: 'Hostel', subSections: ['Boys Hostel', 'Girls Hostel'] },
  { _id: 'sec-transport', name: 'Transport', subSections: ['Route 1', 'Route 2'] },
  { _id: 'sec-general', name: 'General', subSections: [] },
];

const users = [
  { _id: 'usr-admin', name: 'System Admin', email: 'admin@campus.local', password: passwordHash, role: 'admin', department: 'General' },
  { _id: 'usr-teacher-acad', name: 'Academic Teacher', email: 'teacher@campus.local', password: passwordHash, role: 'teacher', department: 'Academics' },
  { _id: 'usr-teacher-hostel', name: 'Hostel Warden', email: 'warden@campus.local', password: passwordHash, role: 'teacher', department: 'Hostel' },
  { _id: 'usr-hod', name: 'Department HOD', email: 'hod@campus.local', password: passwordHash, role: 'hod', department: 'Academics' },
  { _id: 'usr-dean', name: 'Campus Dean', email: 'dean@campus.local', password: passwordHash, role: 'dean', department: 'General' },
  { _id: 'usr-management', name: 'Management Office', email: 'management@campus.local', password: passwordHash, role: 'management', department: 'General' },
  { _id: 'usr-student-a', name: 'Asha Student', email: 'asha@student.local', password: passwordHash, role: 'student', department: 'Academics' },
  { _id: 'usr-student-b', name: 'Rahul Student', email: 'rahul@student.local', password: passwordHash, role: 'student', department: 'Hostel' },
  { _id: 'usr-student-c', name: 'Nisha Student', email: 'nisha@student.local', password: passwordHash, role: 'student', department: 'Transport' },
  { _id: 'usr-student-d', name: 'Arjun Student', email: 'arjun@student.local', password: passwordHash, role: 'student', department: 'General' },
];

const issues = [
  {
    _id: 'iss-001',
    title: 'WiFi outage in CS lab',
    description: 'Internet has been down in Lab 2 for 48 hours and project submissions are blocked.',
    sectionId: 'sec-academics',
    tags: ['wifi', 'lab', 'connectivity'],
    createdBy: 'usr-student-a',
    createdByDepartment: 'Academics',
    imageUrl: '',
    isAnonymous: false,
    assignedTo: 'usr-teacher-acad',
    taggedAuthorityIds: ['usr-teacher-acad', 'usr-hod'],
    escalationLevel: 1,
    status: 'In Progress',
    supportCount: 2,
    createdAt: minusDays(4),
  },
  {
    _id: 'iss-002',
    title: 'Hostel water supply disruption',
    description: 'Morning water supply is unavailable in Block B for the last three days.',
    sectionId: 'sec-hostel',
    tags: ['hostel', 'water', 'maintenance'],
    createdBy: 'usr-student-b',
    createdByDepartment: 'Hostel',
    imageUrl: '',
    isAnonymous: false,
    assignedTo: 'usr-teacher-hostel',
    taggedAuthorityIds: ['usr-teacher-hostel'],
    escalationLevel: 2,
    status: 'Escalated',
    supportCount: 1,
    createdAt: minusDays(3),
  },
  {
    _id: 'iss-003',
    title: 'Library closing before scheduled time',
    description: 'Library has been closing at 5 PM instead of 7 PM this week.',
    sectionId: 'sec-general',
    tags: ['library', 'timing'],
    createdBy: 'usr-student-a',
    createdByDepartment: 'Academics',
    imageUrl: '',
    isAnonymous: true,
    assignedTo: 'usr-admin',
    taggedAuthorityIds: ['usr-admin', 'usr-dean'],
    escalationLevel: 3,
    status: 'Resolved',
    supportCount: 1,
    createdAt: minusDays(2),
  },
  {
    _id: 'iss-004',
    title: 'Bus route delay for morning shift',
    description: 'Route 2 bus arrives 25 minutes late on multiple days, causing attendance issues.',
    sectionId: 'sec-transport',
    tags: ['transport', 'delay'],
    createdBy: 'usr-student-b',
    createdByDepartment: 'Hostel',
    imageUrl: '',
    isAnonymous: false,
    assignedTo: 'usr-management',
    taggedAuthorityIds: ['usr-management'],
    escalationLevel: 1,
    status: 'Open',
    supportCount: 0,
    createdAt: minusDays(1),
  },
  {
    _id: 'iss-005',
    title: 'Exam timetable conflict for AIML batch',
    description: 'Two internal exams are scheduled in overlapping slots for AIML students.',
    sectionId: 'sec-academics',
    tags: ['exam', 'timetable', 'aiml'],
    createdBy: 'usr-student-c',
    createdByDepartment: 'Transport',
    imageUrl: '',
    isAnonymous: false,
    assignedTo: 'usr-hod',
    taggedAuthorityIds: ['usr-hod', 'usr-dean'],
    escalationLevel: 2,
    status: 'Seen',
    supportCount: 3,
    createdAt: minusDays(2),
  },
  {
    _id: 'iss-006',
    title: 'Mess food quality complaints',
    description: 'Multiple students reported low quality food in hostel mess during dinner.',
    sectionId: 'sec-hostel',
    tags: ['hostel', 'mess', 'food'],
    createdBy: 'usr-student-d',
    createdByDepartment: 'General',
    imageUrl: '',
    isAnonymous: false,
    assignedTo: 'usr-management',
    taggedAuthorityIds: ['usr-teacher-hostel', 'usr-management'],
    escalationLevel: 4,
    status: 'Escalated',
    supportCount: 5,
    createdAt: minusDays(5),
  },
];

const interactions = [
  { _id: 'int-001', issueId: 'iss-001', userId: 'usr-student-a', type: 'support', content: '', createdAt: minusDays(4) },
  { _id: 'int-002', issueId: 'iss-001', userId: 'usr-student-b', type: 'support', content: '', createdAt: minusDays(4) },
  { _id: 'int-003', issueId: 'iss-001', userId: 'usr-student-b', type: 'comment', content: 'This also impacts final-year project demo prep.', createdAt: minusDays(3) },
  { _id: 'int-004', issueId: 'iss-002', userId: 'usr-student-a', type: 'support', content: '', createdAt: minusDays(3) },
  { _id: 'int-005', issueId: 'iss-002', userId: 'usr-student-b', type: 'comment', content: 'No water between 6 AM and 9 AM.', createdAt: minusDays(3) },
  { _id: 'int-006', issueId: 'iss-003', userId: 'usr-student-a', type: 'comment', content: 'Issue resolved after escalation.', createdAt: minusDays(1) },
  { _id: 'int-007', issueId: 'iss-005', userId: 'usr-student-a', type: 'support', content: '', createdAt: minusDays(2) },
  { _id: 'int-008', issueId: 'iss-005', userId: 'usr-student-b', type: 'support', content: '', createdAt: minusDays(2) },
  { _id: 'int-009', issueId: 'iss-005', userId: 'usr-student-c', type: 'comment', content: 'Please release corrected timetable before weekend.', createdAt: minusDays(2) },
  { _id: 'int-010', issueId: 'iss-006', userId: 'usr-student-a', type: 'support', content: '', createdAt: minusDays(5) },
  { _id: 'int-011', issueId: 'iss-006', userId: 'usr-student-b', type: 'support', content: '', createdAt: minusDays(5) },
  { _id: 'int-012', issueId: 'iss-006', userId: 'usr-student-c', type: 'support', content: '', createdAt: minusDays(4) },
  { _id: 'int-013', issueId: 'iss-006', userId: 'usr-student-d', type: 'comment', content: 'Photos from mess are uploaded as evidence.', createdAt: minusDays(4) },
];

const evidence = [
  { _id: 'ev-001', issueId: 'iss-001', userId: 'usr-student-a', fileUrl: '', text: 'Speed test screenshot shows 0.2 Mbps.', createdAt: minusDays(4) },
  { _id: 'ev-002', issueId: 'iss-002', userId: 'usr-student-b', fileUrl: '', text: 'Video evidence of dry taps in Block B.', createdAt: minusDays(3) },
  { _id: 'ev-003', issueId: 'iss-004', userId: 'usr-student-b', fileUrl: '', text: 'Attendance log reflects delay impact.', createdAt: minusDays(1) },
  { _id: 'ev-004', issueId: 'iss-005', userId: 'usr-student-c', fileUrl: '', text: 'Screenshot of overlapping exam schedule.', createdAt: minusDays(2) },
  { _id: 'ev-005', issueId: 'iss-006', userId: 'usr-student-d', fileUrl: '', text: 'Image references for food quality issue.', createdAt: minusDays(4) },
];

const logs = [
  { _id: 'log-001', service: 'issue-service', action: 'seed_issue_created', userId: 'usr-student-a', issueId: 'iss-001', details: {}, createdAt: minusDays(4) },
  { _id: 'log-002', service: 'interaction-service', action: 'seed_issue_supported', userId: 'usr-student-b', issueId: 'iss-001', details: {}, createdAt: minusDays(4) },
  { _id: 'log-003', service: 'escalation-service', action: 'seed_issue_escalated', userId: 'usr-student-d', issueId: 'iss-006', details: { level: 4 }, createdAt: minusDays(4) },
  { _id: 'log-004', service: 'status-service', action: 'seed_admin_status_update', userId: 'usr-admin', issueId: 'iss-003', details: { status: 'Resolved' }, createdAt: minusDays(1) },
];

const notifications = [
  {
    _id: 'not-001',
    recipientId: 'usr-teacher-acad',
    type: 'issue_tagged',
    title: 'You were tagged in an issue',
    message: 'A student tagged you in "WiFi outage in CS lab"',
    link: '/issues/iss-001',
    actorId: 'usr-student-a',
    issueId: 'iss-001',
    isRead: false,
    createdAt: minusDays(3),
  },
  {
    _id: 'not-002',
    recipientId: 'usr-hod',
    type: 'issue_tagged',
    title: 'You were tagged in an issue',
    message: 'A student tagged you in "Exam timetable conflict for AIML batch"',
    link: '/issues/iss-005',
    actorId: 'usr-student-c',
    issueId: 'iss-005',
    isRead: true,
    createdAt: minusDays(2),
  },
];

writeJson('sections.json', sections);
writeJson('users.json', users);
writeJson('issues.json', issues);
writeJson('interactions.json', interactions);
writeJson('evidence.json', evidence);
writeJson('logs.json', logs);
writeJson('notifications.json', notifications);

console.log('Demo data seeded successfully.');
console.log('Demo logins:');
console.log('- admin@campus.local / password123');
console.log('- teacher@campus.local / password123');
console.log('- hod@campus.local / password123');
console.log('- dean@campus.local / password123');
console.log('- management@campus.local / password123');
console.log('- asha@student.local / password123');
console.log('- rahul@student.local / password123');
console.log('- nisha@student.local / password123');
console.log('- arjun@student.local / password123');
