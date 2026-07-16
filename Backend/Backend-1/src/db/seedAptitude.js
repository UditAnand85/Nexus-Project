/**
 * seedAptitude.js
 *
 * One-time seed script that populates the global aptitude question pool.
 * Run with: node src/db/seedAptitude.js
 *
 * Inserts ~120 MCQs with job_id = NULL (global pool):
 *  - 40 Quantitative Aptitude questions
 *  - 40 Analytical Reasoning questions
 *  - 40 Spatial Reasoning questions
 *
 * Test delivery query:
 *   SELECT * FROM aptitude_questions WHERE job_id IS NULL ORDER BY RANDOM() LIMIT 20
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { aptitudeQuestions } from './schema/assessments.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env');
  process.exit(1);
}

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient);

// ─────────────────────────────────────────────────────────────────────────────
// 40 QUANTITATIVE APTITUDE QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
const quantitative = [
  {
    question: 'If a train travels 360 km in 4 hours, what is its speed in km/h?',
    option_a: '80', option_b: '90', option_c: '100', option_d: '70',
    correct_answer: 'B',
  },
  {
    question: 'A shopkeeper buys an article for ₹500 and sells it for ₹625. What is the profit percentage?',
    option_a: '20%', option_b: '25%', option_c: '30%', option_d: '15%',
    correct_answer: 'B',
  },
  {
    question: 'What is 15% of 240?',
    option_a: '36', option_b: '32', option_c: '38', option_d: '30',
    correct_answer: 'A',
  },
  {
    question: 'The simple interest on ₹2000 at 5% per annum for 3 years is:',
    option_a: '₹300', option_b: '₹250', option_c: '₹350', option_d: '₹200',
    correct_answer: 'A',
  },
  {
    question: 'If 3x + 7 = 22, what is the value of x?',
    option_a: '4', option_b: '5', option_c: '6', option_d: '3',
    correct_answer: 'B',
  },
  {
    question: 'A pipe can fill a tank in 6 hours. Another pipe can empty it in 12 hours. If both are open, how long will it take to fill the tank?',
    option_a: '10 hours', option_b: '12 hours', option_c: '8 hours', option_d: '14 hours',
    correct_answer: 'B',
  },
  {
    question: 'The average of 5 numbers is 40. If one number is removed, the average becomes 38. What number was removed?',
    option_a: '45', option_b: '50', option_c: '48', option_d: '52',
    correct_answer: 'C',
  },
  {
    question: 'What is the LCM of 12, 18, and 24?',
    option_a: '36', option_b: '48', option_c: '72', option_d: '96',
    correct_answer: 'C',
  },
  {
    question: 'Two numbers are in the ratio 3:5. If their sum is 64, what is the larger number?',
    option_a: '24', option_b: '30', option_c: '36', option_d: '40',
    correct_answer: 'D',
  },
  {
    question: 'A car covers a distance of 150 km in 2.5 hours. What is its speed in m/s?',
    option_a: '15 m/s', option_b: '16.67 m/s', option_c: '20 m/s', option_d: '12.5 m/s',
    correct_answer: 'B',
  },
  {
    question: 'Find the compound interest on ₹1000 at 10% per annum for 2 years.',
    option_a: '₹200', option_b: '₹210', option_c: '₹220', option_d: '₹190',
    correct_answer: 'B',
  },
  {
    question: 'If a number is increased by 20% and then decreased by 20%, the net change is:',
    option_a: '0%', option_b: '-4%', option_c: '+4%', option_d: '-2%',
    correct_answer: 'B',
  },
  {
    question: 'What is the square root of 1764?',
    option_a: '42', option_b: '41', option_c: '43', option_d: '44',
    correct_answer: 'A',
  },
  {
    question: 'A work can be completed by A in 10 days and B in 15 days. How long will they take working together?',
    option_a: '5 days', option_b: '6 days', option_c: '8 days', option_d: '4 days',
    correct_answer: 'B',
  },
  {
    question: 'The perimeter of a rectangle is 60 cm. If the length is 20 cm, what is the width?',
    option_a: '10 cm', option_b: '15 cm', option_c: '20 cm', option_d: '12 cm',
    correct_answer: 'A',
  },
  {
    question: 'If P : Q = 2 : 3 and Q : R = 4 : 5, then P : R is:',
    option_a: '6:10', option_b: '8:15', option_c: '4:9', option_d: '2:5',
    correct_answer: 'B',
  },
  {
    question: 'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest?',
    option_a: '10%', option_b: '12%', option_c: '12.5%', option_d: '8%',
    correct_answer: 'C',
  },
  {
    question: 'How many prime numbers are there between 1 and 30?',
    option_a: '8', option_b: '9', option_c: '10', option_d: '11',
    correct_answer: 'C',
  },
  {
    question: 'A salesman earns a commission of 8% on sales of ₹15,000. What is his commission?',
    option_a: '₹1000', option_b: '₹1200', option_c: '₹1500', option_d: '₹800',
    correct_answer: 'B',
  },
  {
    question: 'The HCF of 36 and 48 is:',
    option_a: '6', option_b: '12', option_c: '18', option_d: '24',
    correct_answer: 'B',
  },
  {
    question: 'If 8 men can do a job in 12 days, how many days will 6 men take?',
    option_a: '14', option_b: '16', option_c: '18', option_d: '20',
    correct_answer: 'B',
  },
  {
    question: 'What is 3/8 expressed as a percentage?',
    option_a: '32.5%', option_b: '37.5%', option_c: '35%', option_d: '40%',
    correct_answer: 'B',
  },
  {
    question: 'Find the missing number: 2, 6, 12, 20, 30, __',
    option_a: '40', option_b: '42', option_c: '44', option_d: '38',
    correct_answer: 'B',
  },
  {
    question: 'If a = 5, b = 3, then (a + b)² - (a - b)² equals:',
    option_a: '30', option_b: '48', option_c: '60', option_d: '64',
    correct_answer: 'C',
  },
  {
    question: 'A boat goes 24 km upstream in 6 hours and 28 km downstream in 4 hours. Find the speed of the boat in still water.',
    option_a: '7 km/h', option_b: '7.5 km/h', option_c: '8 km/h', option_d: '6 km/h',
    correct_answer: 'A',
  },
  {
    question: 'What is 12³?',
    option_a: '1728', option_b: '1444', option_c: '1694', option_d: '1764',
    correct_answer: 'A',
  },
  {
    question: 'The area of a circle with radius 7 cm is: (Use π = 22/7)',
    option_a: '154 cm²', option_b: '144 cm²', option_c: '148 cm²', option_d: '160 cm²',
    correct_answer: 'A',
  },
  {
    question: 'A discount of 30% is given on an item marked at ₹800. The selling price is:',
    option_a: '₹560', option_b: '₹540', option_c: '₹600', option_d: '₹520',
    correct_answer: 'A',
  },
  {
    question: 'If x% of 150 = 45, then x is:',
    option_a: '25', option_b: '30', option_c: '35', option_d: '20',
    correct_answer: 'B',
  },
  {
    question: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    option_a: '7.5°', option_b: '0°', option_c: '15°', option_d: '22.5°',
    correct_answer: 'A',
  },
  {
    question: 'How many ways can 4 people sit in a row of 4 seats?',
    option_a: '16', option_b: '24', option_c: '12', option_d: '20',
    correct_answer: 'B',
  },
  {
    question: 'A train 200 m long passes a pole in 10 seconds. Its speed is:',
    option_a: '72 km/h', option_b: '60 km/h', option_c: '80 km/h', option_d: '54 km/h',
    correct_answer: 'A',
  },
  {
    question: 'If log₁₀(100) = x, then x is:',
    option_a: '1', option_b: '2', option_c: '10', option_d: '0.1',
    correct_answer: 'B',
  },
  {
    question: 'A sum triples in 10 years at simple interest. What is the rate?',
    option_a: '10%', option_b: '15%', option_c: '20%', option_d: '25%',
    correct_answer: 'C',
  },
  {
    question: 'The cost of 12 pens is ₹180. What will 20 pens cost?',
    option_a: '₹280', option_b: '₹300', option_c: '₹320', option_d: '₹250',
    correct_answer: 'B',
  },
  {
    question: 'Which of the following is divisible by 11? ',
    option_a: '132', option_b: '133', option_c: '134', option_d: '135',
    correct_answer: 'A',
  },
  {
    question: 'The sum of first 20 natural numbers is:',
    option_a: '190', option_b: '200', option_c: '210', option_d: '180',
    correct_answer: 'C',
  },
  {
    question: 'If 40% of a number is 80, what is 60% of that number?',
    option_a: '100', option_b: '110', option_c: '120', option_d: '130',
    correct_answer: 'C',
  },
  {
    question: 'A 10% increase followed by a 10% decrease results in what net change?',
    option_a: '0%', option_b: '-1%', option_c: '+1%', option_d: '-2%',
    correct_answer: 'B',
  },
  {
    question: 'The probability of getting a head when a fair coin is tossed twice is:',
    option_a: '1/4', option_b: '1/2', option_c: '3/4', option_d: '1',
    correct_answer: 'C',
  },
].map((q) => ({ ...q, category: 'Quantitative' }));

// ─────────────────────────────────────────────────────────────────────────────
// 40 ANALYTICAL REASONING QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
const analytical = [
  {
    question: 'All cats are animals. Some animals are dogs. Which conclusion is definitely true?',
    option_a: 'All cats are dogs', option_b: 'Some dogs are cats', option_c: 'All cats are animals', option_d: 'Some cats are dogs',
    correct_answer: 'C',
  },
  {
    question: 'A is taller than B. B is taller than C. Who is the shortest?',
    option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'Cannot determine',
    correct_answer: 'C',
  },
  {
    question: 'If RED = 27 and BLUE = 40, what does GREEN equal (each letter = its position in alphabet)?',
    option_a: '49', option_b: '57', option_c: '52', option_d: '45',
    correct_answer: 'B',
  },
  {
    question: 'Find the odd one out: Apple, Mango, Potato, Orange',
    option_a: 'Apple', option_b: 'Mango', option_c: 'Potato', option_d: 'Orange',
    correct_answer: 'C',
  },
  {
    question: 'Pointing to a photo, Ram says "She is the daughter of my grandfather\'s only son." What relation is she to Ram?',
    option_a: 'Sister', option_b: 'Cousin', option_c: 'Niece', option_d: 'Mother',
    correct_answer: 'A',
  },
  {
    question: 'Complete the series: 3, 9, 27, 81, __',
    option_a: '162', option_b: '243', option_c: '324', option_d: '189',
    correct_answer: 'B',
  },
  {
    question: 'If P is the brother of Q, Q is the sister of R, and R is the son of S, how is P related to S?',
    option_a: 'Son', option_b: 'Nephew', option_c: 'Grandson', option_d: 'Brother',
    correct_answer: 'A',
  },
  {
    question: 'In a row, A is 5th from the left and 6th from the right. How many people are in the row?',
    option_a: '10', option_b: '11', option_c: '12', option_d: '9',
    correct_answer: 'A',
  },
  {
    question: 'If BOOK is coded as CPPL, how is MANGO coded?',
    option_a: 'NBOHO', option_b: 'NBNHP', option_c: 'NBOHP', option_d: 'NCOHP',
    correct_answer: 'C',
  },
  {
    question: 'Which number replaces the question mark? 2, 4, 8, 16, ?',
    option_a: '24', option_b: '28', option_c: '32', option_d: '36',
    correct_answer: 'C',
  },
  {
    question: 'A is twice as old as B. If the sum of their ages is 42, how old is A?',
    option_a: '24', option_b: '26', option_c: '28', option_d: '30',
    correct_answer: 'C',
  },
  {
    question: 'All roses are flowers. All flowers need water. Therefore:',
    option_a: 'All flowers are roses', option_b: 'All roses need water', option_c: 'Some water has flowers', option_d: 'Roses do not need water',
    correct_answer: 'B',
  },
  {
    question: 'Which letter comes next in the series: Z, X, V, T, ?',
    option_a: 'R', option_b: 'S', option_c: 'Q', option_d: 'P',
    correct_answer: 'A',
  },
  {
    question: 'A person travels 3 km north, then 4 km east. How far is he from the starting point?',
    option_a: '7 km', option_b: '5 km', option_c: '6 km', option_d: '4 km',
    correct_answer: 'B',
  },
  {
    question: 'If today is Wednesday, what day will it be after 100 days?',
    option_a: 'Monday', option_b: 'Tuesday', option_c: 'Friday', option_d: 'Thursday',
    correct_answer: 'C',
  },
  {
    question: 'Which of the following is different from the others? 17, 19, 23, 25, 29',
    option_a: '17', option_b: '19', option_c: '25', option_d: '29',
    correct_answer: 'C',
  },
  {
    question: 'If TRAIN is coded as USBJM, how is CAT coded?',
    option_a: 'DBU', option_b: 'DBV', option_c: 'DCU', option_d: 'EBU',
    correct_answer: 'A',
  },
  {
    question: 'A clock is showing 6:30. What is the angle between hour and minute hands?',
    option_a: '0°', option_b: '10°', option_c: '15°', option_d: '30°',
    correct_answer: 'C',
  },
  {
    question: 'In a class, 30 students like cricket, 25 like football, and 10 like both. How many like at least one sport?',
    option_a: '45', option_b: '55', option_c: '65', option_d: '50',
    correct_answer: 'A',
  },
  {
    question: 'Which figure completes the analogy? Triangle:3 sides :: Pentagon:?',
    option_a: '4', option_b: '5', option_c: '6', option_d: '7',
    correct_answer: 'B',
  },
  {
    question: 'If 5 × 3 = 25 and 6 × 4 = 40 in a certain code, what is 7 × 5?',
    option_a: '55', option_b: '56', option_c: '60', option_d: '57',
    correct_answer: 'A',
  },
  {
    question: 'Complete the analogy: Doctor : Hospital :: Teacher : ?',
    option_a: 'Office', option_b: 'School', option_c: 'Library', option_d: 'Class',
    correct_answer: 'B',
  },
  {
    question: 'How many times does the digit 3 appear from 1 to 50?',
    option_a: '5', option_b: '6', option_c: '7', option_d: '8',
    correct_answer: 'A',
  },
  {
    question: 'Statements: All birds can fly. Ostrich is a bird. Conclusion: Ostrich can fly. Is this valid?',
    option_a: 'Yes, valid', option_b: 'No, ostrich cannot fly', option_c: 'Cannot determine', option_d: 'Partially valid',
    correct_answer: 'A',
  },
  {
    question: 'If 1st Jan 2000 was a Saturday, what day was 1st Jan 2001?',
    option_a: 'Sunday', option_b: 'Monday', option_c: 'Saturday', option_d: 'Tuesday',
    correct_answer: 'B',
  },
  {
    question: 'A sequence: 1, 4, 9, 16, 25 — the next number is:',
    option_a: '30', option_b: '36', option_c: '35', option_d: '49',
    correct_answer: 'B',
  },
  {
    question: 'Choose the word most similar in meaning to "Loquacious":',
    option_a: 'Silent', option_b: 'Talkative', option_c: 'Logical', option_d: 'Suspicious',
    correct_answer: 'B',
  },
  {
    question: 'Six people are seated in a circle. If A is opposite B, and C is next to A, which statement is possible?',
    option_a: 'B is next to C', option_b: 'A is next to B', option_c: 'C is opposite B', option_d: 'A and C are opposite',
    correct_answer: 'A',
  },
  {
    question: 'Read: "All managers are employees. No employee is lazy." Conclusion: "No manager is lazy." Is this valid?',
    option_a: 'Yes', option_b: 'No', option_c: 'Partially', option_d: 'Cannot say',
    correct_answer: 'A',
  },
  {
    question: 'Find the pattern: 5, 11, 23, 47, __ ?',
    option_a: '95', option_b: '93', option_c: '97', option_d: '99',
    correct_answer: 'A',
  },
  {
    question: 'Arun is 7 ranks ahead of Bala in a class of 39. If Bala is 20th from the last, what is Arun\'s rank from the top?',
    option_a: '12', option_b: '13', option_c: '14', option_d: '15',
    correct_answer: 'B',
  },
  {
    question: 'If LAPTOP → NCRVQR in a code, what does MOUSE become?',
    option_a: 'OQWUG', option_b: 'OQWWG', option_c: 'PQWUG', option_d: 'OPWUG',
    correct_answer: 'A',
  },
  {
    question: 'Two trains leave stations A and B (500 km apart) at the same time toward each other. Train A at 60 km/h and Train B at 40 km/h. When do they meet?',
    option_a: '4 hours', option_b: '5 hours', option_c: '6 hours', option_d: '3 hours',
    correct_answer: 'B',
  },
  {
    question: 'Which is the mirror image of "MEDIA" when reflected on a vertical axis?',
    option_a: 'AIDEM', option_b: 'AMEDI', option_c: 'AIEDM', option_d: 'AIME D',
    correct_answer: 'A',
  },
  {
    question: 'A bag has 3 red, 4 blue, and 5 green balls. What is the probability of picking a blue ball?',
    option_a: '1/3', option_b: '1/4', option_c: '5/12', option_d: '3/12',
    correct_answer: 'A',
  },
  {
    question: 'ABCD is a square. E is the midpoint of AB. What fraction of the square\'s area does triangle AEP (P = center) represent?',
    option_a: '1/8', option_b: '1/4', option_c: '3/8', option_d: '1/6',
    correct_answer: 'A',
  },
  {
    question: 'Which word is NOT a synonym of "Ephemeral"?',
    option_a: 'Transient', option_b: 'Fleeting', option_c: 'Eternal', option_d: 'Brief',
    correct_answer: 'C',
  },
  {
    question: 'Odd one out: 8, 27, 64, 100, 125',
    option_a: '8', option_b: '27', option_c: '100', option_d: '125',
    correct_answer: 'C',
  },
  {
    question: 'In a tournament, every team plays against every other team once. With 6 teams, how many matches are played?',
    option_a: '12', option_b: '15', option_c: '18', option_d: '20',
    correct_answer: 'B',
  },
  {
    question: 'Which number is missing? 1, 1, 2, 3, 5, 8, __, 21',
    option_a: '11', option_b: '12', option_c: '13', option_d: '14',
    correct_answer: 'C',
  },
].map((q) => ({ ...q, category: 'Analytical' }));

// ─────────────────────────────────────────────────────────────────────────────
// 40 SPATIAL REASONING QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
const spatial = [
  {
    question: 'How many faces does a cube have?',
    option_a: '4', option_b: '6', option_c: '8', option_d: '12',
    correct_answer: 'B',
  },
  {
    question: 'A square piece of paper is folded in half diagonally, then folded again. How many layers does it have?',
    option_a: '2', option_b: '3', option_c: '4', option_d: '8',
    correct_answer: 'C',
  },
  {
    question: 'When a cube is unfolded, how many squares are in its net?',
    option_a: '4', option_b: '5', option_c: '6', option_d: '8',
    correct_answer: 'C',
  },
  {
    question: 'A clock shows 9:00. If you look at the clock in a mirror, what time does it appear to show?',
    option_a: '9:00', option_b: '3:00', option_c: '12:00', option_d: '6:00',
    correct_answer: 'B',
  },
  {
    question: 'How many small cubes are needed to build a 3×3×3 larger cube?',
    option_a: '9', option_b: '18', option_c: '27', option_d: '36',
    correct_answer: 'C',
  },
  {
    question: 'A rectangle 10 cm × 6 cm is rotated 90° clockwise. The new orientation is:',
    option_a: '10 cm × 6 cm (same)', option_b: '6 cm wide × 10 cm tall', option_c: '6 cm × 6 cm', option_d: '10 cm × 10 cm',
    correct_answer: 'B',
  },
  {
    question: 'In a 3D coordinate system, the point (2, 3, 4) is reflected over the XY plane to become:',
    option_a: '(-2, 3, 4)', option_b: '(2, -3, 4)', option_c: '(2, 3, -4)', option_d: '(-2, -3, 4)',
    correct_answer: 'C',
  },
  {
    question: 'A cube has how many edges?',
    option_a: '8', option_b: '10', option_c: '12', option_d: '14',
    correct_answer: 'C',
  },
  {
    question: 'Which 2D shape has only one line of symmetry?',
    option_a: 'Square', option_b: 'Isosceles triangle', option_c: 'Circle', option_d: 'Rectangle',
    correct_answer: 'B',
  },
  {
    question: 'If a 2D "L" shape is rotated 180°, which letter does it most resemble?',
    option_a: 'J', option_b: 'r', option_c: '⌐ (Γ)', option_d: 'T',
    correct_answer: 'C',
  },
  {
    question: 'How many vertices does a triangular prism have?',
    option_a: '4', option_b: '5', option_c: '6', option_d: '8',
    correct_answer: 'C',
  },
  {
    question: 'Looking at a 4×4 grid from above, how many 2×2 sub-squares are there?',
    option_a: '4', option_b: '6', option_c: '8', option_d: '9',
    correct_answer: 'D',
  },
  {
    question: 'A cylinder is cut horizontally. The cross-section is:',
    option_a: 'Rectangle', option_b: 'Ellipse', option_c: 'Circle', option_d: 'Square',
    correct_answer: 'C',
  },
  {
    question: 'How many sides does a dodecagon have?',
    option_a: '10', option_b: '11', option_c: '12', option_d: '14',
    correct_answer: 'C',
  },
  {
    question: 'Which of these 3D shapes has a circular base and an apex?',
    option_a: 'Cylinder', option_b: 'Sphere', option_c: 'Cone', option_d: 'Cube',
    correct_answer: 'C',
  },
  {
    question: 'If you look at a die with 1 on top and 2 facing you, which number is on the bottom?',
    option_a: '3', option_b: '4', option_c: '5', option_d: '6',
    correct_answer: 'D',
  },
  {
    question: 'A 3×3×3 cube is painted red on all faces. How many small unit cubes have exactly 2 red faces?',
    option_a: '8', option_b: '12', option_c: '16', option_d: '24',
    correct_answer: 'B',
  },
  {
    question: 'A shape is reflected across the Y-axis. The point (3, -5) moves to:',
    option_a: '(-3, -5)', option_b: '(3, 5)', option_c: '(-3, 5)', option_d: '(5, -3)',
    correct_answer: 'A',
  },
  {
    question: 'Which of these nets will NOT fold into a cube? (Assume standard T/L/S-shaped nets)',
    option_a: 'T-shape (1×4 row + 2 on opposite sides)', option_b: 'L-shape (4 in a row + 2 extras)', option_c: '3×2 rectangle of 6 squares', option_d: 'Z-shape (staircase)',
    correct_answer: 'C',
  },
  {
    question: 'A 5×5 grid of dots has how many rectangles (including squares)?',
    option_a: '60', option_b: '90', option_c: '100', option_d: '50',
    correct_answer: 'C',
  },
  {
    question: 'In a 3D figure, if a shape has 5 faces, 8 edges, and 5 vertices, what shape is it?',
    option_a: 'Triangular prism', option_b: 'Square pyramid', option_c: 'Cube', option_d: 'Octahedron',
    correct_answer: 'B',
  },
  {
    question: 'The letter "Z" rotated 90° clockwise looks like:',
    option_a: 'S', option_b: 'N', option_c: '2', option_d: 'Z',
    correct_answer: 'B',
  },
  {
    question: 'A tetrahedron has how many faces?',
    option_a: '3', option_b: '4', option_c: '5', option_d: '6',
    correct_answer: 'B',
  },
  {
    question: 'Which line divides a regular hexagon into two identical halves?',
    option_a: 'Any diagonal', option_b: 'A line through two opposite vertices', option_c: 'A line through the midpoints of two opposite sides', option_d: 'Both B and C',
    correct_answer: 'D',
  },
  {
    question: 'In a map, north is up. A person walks east, then south, then west, then north. They are now:',
    option_a: 'Back at start', option_b: 'East of start', option_c: 'West of start', option_d: 'North of start',
    correct_answer: 'A',
  },
  {
    question: 'How many triangles are in a figure with 5 lines passing through a central point?',
    option_a: '10', option_b: '15', option_c: '20', option_d: '5',
    correct_answer: 'A',
  },
  {
    question: 'A prism with a pentagonal base has how many faces?',
    option_a: '5', option_b: '6', option_c: '7', option_d: '8',
    correct_answer: 'C',
  },
  {
    question: 'A sphere is cut by a plane. The cross-section is always a:',
    option_a: 'Square', option_b: 'Triangle', option_c: 'Circle', option_d: 'Ellipse',
    correct_answer: 'C',
  },
  {
    question: 'If you stand facing west and turn 270° clockwise, you now face:',
    option_a: 'North', option_b: 'East', option_c: 'South', option_d: 'West',
    correct_answer: 'A',
  },
  {
    question: 'How many small unit cubes are on the surface of a 4×4×4 cube?',
    option_a: '56', option_b: '64', option_c: '48', option_d: '72',
    correct_answer: 'A',
  },
  {
    question: 'A square is rotated 45°. What does it look like?',
    option_a: 'A circle', option_b: 'A diamond (rhombus)', option_c: 'A triangle', option_d: 'A rectangle',
    correct_answer: 'B',
  },
  {
    question: 'How many lines of symmetry does a regular pentagon have?',
    option_a: '3', option_b: '4', option_c: '5', option_d: '10',
    correct_answer: 'C',
  },
  {
    question: 'A rectangular solid (cuboid) of 2×3×4 is made of unit cubes. How many unit cubes are completely hidden inside (no face on surface)?',
    option_a: '0', option_b: '2', option_c: '4', option_d: '6',
    correct_answer: 'B',
  },
  {
    question: 'Which shape has 0 vertices?',
    option_a: 'Cone', option_b: 'Cylinder', option_c: 'Sphere', option_d: 'Circle',
    correct_answer: 'C',
  },
  {
    question: 'If you view a cube from one corner (isometric view), how many faces are visible?',
    option_a: '1', option_b: '2', option_c: '3', option_d: '4',
    correct_answer: 'C',
  },
  {
    question: 'An octahedron has how many faces?',
    option_a: '6', option_b: '7', option_c: '8', option_d: '10',
    correct_answer: 'C',
  },
  {
    question: 'A staircase with 5 steps — each step is 1m wide and 0.5m tall. Viewed from the side, the outline is:',
    option_a: 'A triangle', option_b: 'A rectangle', option_c: 'A stepped/staircase polygon', option_d: 'An L-shape',
    correct_answer: 'C',
  },
  {
    question: 'The front view of a cone placed on its circular base is:',
    option_a: 'A circle', option_b: 'A triangle', option_c: 'A rectangle', option_d: 'A semicircle',
    correct_answer: 'B',
  },
  {
    question: 'A figure has rotational symmetry of order 4. The minimum angle of rotation to look the same is:',
    option_a: '45°', option_b: '60°', option_c: '90°', option_d: '180°',
    correct_answer: 'C',
  },
  {
    question: 'If a cube has its top and bottom faces painted blue and the other 4 faces painted red, and is then cut into 27 unit cubes, how many have at least 1 blue face?',
    option_a: '9', option_b: '12', option_c: '15', option_d: '18',
    correct_answer: 'D',
  },
].map((q) => ({ ...q, category: 'Spatial' }));

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

const allQuestions = [
  ...quantitative, // 40
  ...analytical,   // 40
  ...spatial,      // 40
]; // Total: 120

const run = async () => {
  try {
    console.log(`\n🌱 Seeding ${allQuestions.length} global aptitude questions...\n`);

    // Insert in one batch (all have job_id = null — global pool)
    await db.insert(aptitudeQuestions).values(allQuestions);

    console.log(`✅ Successfully inserted ${allQuestions.length} aptitude questions:`);
    console.log(`   - 40 Quantitative`);
    console.log(`   - 40 Analytical`);
    console.log(`   - 40 Spatial`);
    console.log('\nDone! 🎉\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

run();
