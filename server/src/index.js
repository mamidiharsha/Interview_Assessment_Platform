const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const questionRoutes = require('./routes/questions');
const submissionRoutes = require('./routes/submissions');
const violationRoutes = require('./routes/violations');
const adminRoutes = require('./routes/admin');
const executeRoutes = require('./routes/execute');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/execute', executeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');

    // Seed default admin user
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@assessment.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });
      console.log('Default admin created: admin@assessment.com / admin123');
    }

    // Seed a demo candidate
    const existingCandidate = await User.findOne({ role: 'candidate' });
    if (!existingCandidate) {
      const hashedPassword = await bcrypt.hash('candidate123', 10);
      await User.create({
        email: 'candidate@test.com',
        password: hashedPassword,
        name: 'John Doe',
        role: 'candidate'
      });
      console.log('Demo candidate created: candidate@test.com / candidate123');
    }

    // Seed demo assessment with questions
    const Assessment = require('./models/Assessment');
    const Question = require('./models/Question');
    const existingAssessment = await Assessment.findOne();
    if (!existingAssessment) {
      const assessment = await Assessment.create({
        title: 'Full Stack Developer Assessment',
        description: 'Comprehensive technical and coding assessment for Full Stack Developer position.',
        technicalTimer: 1800,
        codingTimer: 2700,
        masterTimer: 5400,
        isActive: true,
        createdBy: (await User.findOne({ role: 'admin' }))._id
      });

      // Seed technical questions
      const technicalQuestions = [
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'What is the time complexity of binary search?',
          description: 'Choose the correct time complexity for the binary search algorithm on a sorted array.',
          options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
          correctAnswer: 1,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'Which data structure uses LIFO principle?',
          description: 'Identify the data structure that follows Last In First Out ordering.',
          options: ['Queue', 'Stack', 'Linked List', 'Tree'],
          correctAnswer: 1,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'What does REST stand for?',
          description: 'Select the full form of REST in the context of web APIs.',
          options: [
            'Representational State Transfer',
            'Remote Execution Service Technology',
            'Reliable Efficient Stateless Transfer',
            'Resource Entity State Tracking'
          ],
          correctAnswer: 0,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'Which HTTP method is idempotent?',
          description: 'Select the HTTP method that produces the same result regardless of how many times it is called.',
          options: ['POST', 'PATCH', 'PUT', 'None of the above'],
          correctAnswer: 2,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'What is the output of typeof null in JavaScript?',
          description: 'Select the correct output.',
          options: ['"null"', '"undefined"', '"object"', '"boolean"'],
          correctAnswer: 2,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'theory',
          section: 'technical',
          title: 'Explain the difference between SQL and NoSQL databases',
          description: 'Provide a detailed comparison covering data models, scalability, consistency, and use cases for SQL vs NoSQL databases.',
          options: [],
          points: 10
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'Which sorting algorithm has the best average-case time complexity?',
          description: 'Select the sorting algorithm with optimal average-case performance.',
          options: ['Bubble Sort - O(n²)', 'Merge Sort - O(n log n)', 'Selection Sort - O(n²)', 'Insertion Sort - O(n²)'],
          correctAnswer: 1,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'What is the purpose of the virtual DOM in React?',
          description: 'Select the best description of why React uses a virtual DOM.',
          options: [
            'To directly manipulate the real DOM faster',
            'To batch and minimize actual DOM updates for performance',
            'To replace HTML entirely',
            'To enable server-side rendering only'
          ],
          correctAnswer: 1,
          points: 5
        },
        {
          assessmentId: assessment._id,
          type: 'theory',
          section: 'technical',
          title: 'Describe the CAP theorem',
          description: 'Explain the CAP theorem in distributed systems. What are the three guarantees, and why can a system only provide two of the three?',
          options: [],
          points: 10
        },
        {
          assessmentId: assessment._id,
          type: 'mcq',
          section: 'technical',
          title: 'What is a closure in JavaScript?',
          description: 'Select the most accurate definition of a closure.',
          options: [
            'A function that has no return value',
            'A function bundled with its lexical scope',
            'A function that only runs once',
            'A function that takes another function as argument'
          ],
          correctAnswer: 1,
          points: 5
        }
      ];
      await Question.insertMany(technicalQuestions);

      // Seed coding questions
      const codingQuestions = [
        {
          assessmentId: assessment._id,
          type: 'coding',
          section: 'coding',
          title: 'Two Sum',
          description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
          constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
          sampleInput: 'nums = [2,7,11,15], target = 9',
          sampleOutput: '[0,1]',
          testCases: [
            { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
            { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
            { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
            { input: '1 5 3 7 2\n9', expectedOutput: '1 3', isHidden: true }
          ],
          points: 20
        },
        {
          assessmentId: assessment._id,
          type: 'coding',
          section: 'coding',
          title: 'Reverse a Linked List',
          description: 'Given the head of a singly linked list, reverse the list and return the reversed list.\n\nRepresent the linked list as space-separated values. Output the reversed list as space-separated values.',
          constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
          sampleInput: '1 2 3 4 5',
          sampleOutput: '5 4 3 2 1',
          testCases: [
            { input: '1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
            { input: '1 2', expectedOutput: '2 1', isHidden: false },
            { input: '1', expectedOutput: '1', isHidden: true },
            { input: '10 20 30 40 50 60', expectedOutput: '60 50 40 30 20 10', isHidden: true }
          ],
          points: 25
        },
        {
          assessmentId: assessment._id,
          type: 'coding',
          section: 'coding',
          title: 'FizzBuzz',
          description: 'Given an integer n, return a string array where:\n- answer[i] == "FizzBuzz" if i is divisible by 3 and 5\n- answer[i] == "Fizz" if i is divisible by 3\n- answer[i] == "Buzz" if i is divisible by 5\n- answer[i] == i (as string) otherwise\n\nPrint each value on a new line for i from 1 to n.',
          constraints: '1 <= n <= 10^4',
          sampleInput: '5',
          sampleOutput: '1\n2\nFizz\n4\nBuzz',
          testCases: [
            { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false },
            { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: false },
            { input: '1', expectedOutput: '1', isHidden: true },
            { input: '3', expectedOutput: '1\n2\nFizz', isHidden: true }
          ],
          points: 15
        }
      ];
      await Question.insertMany(codingQuestions);
      console.log('Demo assessment with questions seeded successfully');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
