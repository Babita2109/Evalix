import os
import mysql.connector
from mysql.connector import Error
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

load_dotenv()

app = FastAPI(
    title="EVALIX API",
    description="Skill Track — Career Readiness, Upskilling, Technical Assessment & Placement Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. MySQL Connection ---
def get_db_connection():
    try:
        return mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "skilltrack_db"),
        )
    except Error as e:
        print(f"MySQL error: {e}")
        return None

# --- 2. MongoDB Connection ---
mongo_client = MongoClient(
    os.getenv("MONGO_URI", "mongodb://localhost:27017/"),
    serverSelectionTimeoutMS=3000
)
mongo_db = mongo_client[os.getenv("MONGO_DB_NAME", "skilltrack_nosql")]

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

class ApplyRequest(BaseModel):
    candidate_id: str = "CAND_001"
    candidate_name: str = "Candidate"
    job_id: str

class SubmitAssessmentRequest(BaseModel):
    candidate_id: str = "CAND_001"
    assessment_id: str
    answers: Dict[str, str]

class CreateDriveRequest(BaseModel):
    company_name: str
    role_title: str
    package_lpa: str
    required_skills: str
    drive_date: str
    min_cgpa: float = 0.0
    status: str = "Open"

@app.get("/")
def home():
    return {
        "success": True,
        "platform": "EVALIX",
        "module": "Skill Track — Career & Placement Readiness Platform"
    }

@app.get("/api/health")
def health():
    mysql_status = "Disconnected"
    conn = get_db_connection()
    if conn and conn.is_connected():
        conn.close()
        mysql_status = "Connected"

    mongo_status = "Disconnected"
    try:
        mongo_client.admin.command("ping")
        mongo_status = "Connected"
    except Exception as e:
        mongo_status = f"Disconnected ({str(e)})"

    return {
        "success": True,
        "server": "Running",
        "mysql": mysql_status,
        "mongodb": mongo_status
    }

@app.post("/api/seed")
def seed_database():
    try:
        mongo_db.subjects.delete_many({})
        mongo_db.assessments.delete_many({})
        mongo_db.improvement_plans.delete_many({})
        mongo_db.placement_drives.delete_many({})

        subjects_data = [
            {
                "subject_code": "TRK-101",
                "category": "Core Engineering",
                "name": "Data Structures & Algorithms",
                "description": "Problem-solving patterns, time-space complexity, linear & non-linear structures for technical coding rounds.",
                "topics": [
                    {"title": "1. Arrays, Strings & Hashing", "syllabus_details": "Two-pointer technique, Sliding Window, Prefix Sum, HashMaps, Frequency counting."},
                    {"title": "2. Trees, Graphs & Dynamic Programming", "syllabus_details": "Binary Search Trees, BFS/DFS traversals, Shortest Path (Dijkstra), Memoization, Tabulation."}
                ]
            },
            {
                "subject_code": "TRK-102",
                "category": "Backend & Data",
                "name": "Database Engineering (SQL & NoSQL)",
                "description": "Relational schema design, query optimization, indexing, transactions, and distributed document stores.",
                "topics": [
                    {"title": "1. Relational Databases & Query Tuning", "syllabus_details": "Complex Joins, Subqueries, Window Functions, Normalization (1NF-BCNF), ACID & Indexing."},
                    {"title": "2. NoSQL Architecture & MongoDB", "syllabus_details": "Document modeling, BSON, Aggregation pipelines, Replication, Sharding."}
                ]
            },
            {
                "subject_code": "TRK-103",
                "category": "Architecture & Cloud",
                "name": "System Design & Cloud Fundamentals",
                "description": "Scalable backend architecture, API design, caching, load balancing, and microservices for product-based interviews.",
                "topics": [
                    {"title": "1. Scalability & High Availability", "syllabus_details": "Horizontal vs Vertical scaling, Load Balancers, CDN, Redis Caching, Rate Limiting."},
                    {"title": "2. Microservices & REST/API Security", "syllabus_details": "JWT/OAuth2 authentication, Message Queues (Kafka/RabbitMQ), Docker & CI/CD basics."}
                ]
            },
            {
                "subject_code": "TRK-104",
                "category": "Core CS Fundamentals",
                "name": "Operating Systems & Computer Networks",
                "description": "Concurrency, memory management, network protocols, and security essentials for technical screenings.",
                "topics": [
                    {"title": "1. OS Concurrency & Memory", "syllabus_details": "Processes vs Threads, CPU Scheduling, Deadlocks, Mutex/Semaphores, Virtual Memory & Paging."},
                    {"title": "2. Networking & Web Protocols", "syllabus_details": "OSI & TCP/IP stack, DNS resolution, HTTP/HTTPS, TLS handshake, Subnetting & Firewalls."}
                ]
            },
            {
                "subject_code": "TRK-105",
                "category": "Screening & Aptitude",
                "name": "Quantitative Aptitude & Logical Reasoning",
                "description": "Analytical problem solving, numerical ability, and data interpretation for initial hiring assessments.",
                "topics": [
                    {"title": "1. Quantitative Ability", "syllabus_details": "Percentages, Profit & Loss, Time & Work, Speed-Time-Distance, Probability, Permutations."},
                    {"title": "2. Logical & Analytical Reasoning", "syllabus_details": "Number/Letter Series, Blood Relations, Syllogisms, Seating Arrangements, Data Interpretation."}
                ]
            },
            {
                "subject_code": "TRK-106",
                "category": "Career & Corporate Readiness",
                "name": "Professional Communication & Interview Mastery",
                "description": "Executive self-introduction, behavioral storytelling (STAR), stakeholder communication, and role negotiation.",
                "topics": [
                    {
                        "title": "1. How to Introduce Yourself (Professional Pitch Framework)",
                        "syllabus_details": (
                            "Present - Past - Future Framework: "
                            "1) Present: State your name, current role or academic specialization, and core technical domain. "
                            "2) Past: Highlight key projects, internships, or production systems built and measurable outcomes achieved. "
                            "3) Future: Connect your strengths to the target role and explain how you can add value to the organization."
                        ),
                        "sample_fresher_intro": (
                            "Good morning. Thank you for the opportunity to introduce myself. I am XYZ, a Computer Science graduate from ABC Institute with strong hands-on experience in full-stack web development using Python, JavaScript, React, SQL, and MongoDB. "
                            "During my academic tenure and internship, I designed and deployed scalable REST APIs and data-driven applications, focusing on clean architecture and performance. "
                            "I bring strong analytical problem-solving skills and adaptability, and I am eager to contribute as a Software Engineer where I can build reliable software solutions."
                        ),
                        "sample_experienced_intro": (
                            "Good morning. I am XYZ, a Software Engineer with experience in building and maintaining backend microservices and database-driven web applications. "
                            "In my current role at ABC Tech, I work primarily with Python, Node.js, REST APIs, and relational/NoSQL databases, where I helped optimize API response times and streamline deployment workflows. "
                            "I am now looking to take on broader architectural challenges in a growth-oriented engineering team where I can drive high-impact product features."
                        ),
                        "best_practices": [
                            "Keep your pitch concise and structured between 60 to 90 seconds.",
                            "Quantify impact wherever possible (latency reduced, modules delivered, users served).",
                            "Align your highlighted skills directly with the job description.",
                            "Maintain confident posture, clear pacing, and natural delivery."
                        ]
                    },
                    {
                        "title": "2. Behavioral Interviews (STAR Framework)",
                        "syllabus_details": "Structuring answers around Situation, Task, Action, and Result for leadership, conflict resolution, and ownership questions."
                    },
                    {
                        "title": "3. Group Discussions, Resume Walkthrough & Corporate Etiquette",
                        "syllabus_details": "Crisp project explanations, structured GD points (PREP method), professional email writing, and remote interview etiquette."
                    }
                ]
            },
            # --- LOGIC BUILDING & LANGUAGES (C, C++, JAVA, PYTHON) ---
            {
                "subject_code": "TRK-201",
                "category": "Logic Building • C",
                "name": "C Programming & Core Logic Building",
                "description": "Procedural logic building, pattern printing, bitwise manipulation, pointers, and dynamic memory in C.",
                "topics": [
                    {
                        "title": "1. Number Logic & Loop Patterns",
                        "syllabus_details": "Prime numbers, Fibonacci, Armstrong, Palindrome, GCD/LCM, Pascal's Triangle, Diamond & Hollow Star/Number Patterns, Bitwise masking."
                    },
                    {
                        "title": "2. Functions, Recursion & Arrays",
                        "syllabus_details": "Recursive backtracking, 1D/2D array rotations, subarray sums, custom string manipulation (without string.h), binary search."
                    },
                    {
                        "title": "3. Pointers, Structures & Dynamic Memory",
                        "syllabus_details": "Pointer arithmetic, double pointers, function pointers, struct padding/alignment, malloc(), calloc(), realloc(), free()."
                    },
                    {
                        "title": "4. Top C Interview Questions & Answers",
                        "syllabus_details": (
                            "Q1: malloc() vs calloc()? -> malloc() allocates a single uninitialized memory block; calloc() allocates zero-initialized contiguous blocks. | "
                            "Q2: What is a dangling pointer? -> A pointer that still references a memory location after it has been freed. | "
                            "Q3: Difference between struct and union? -> Struct allocates separate memory for each member; Union shares the same memory space equal to its largest member."
                        )
                    }
                ]
            },
            {
                "subject_code": "TRK-202",
                "category": "Logic Building • C++",
                "name": "C++ Logic Building & STL Mastery",
                "description": "Object-oriented problem solving, memory safety, and Standard Template Library (STL) for competitive coding.",
                "topics": [
                    {
                        "title": "1. C++ Core & OOP Architecture",
                        "syllabus_details": "References vs Pointers, Constructors/Destructors, Deep vs Shallow Copy, Operator Overloading, Virtual Functions & V-Table, Abstract Classes."
                    },
                    {
                        "title": "2. Standard Template Library (STL) for Logic Building",
                        "syllabus_details": "vector, pair, map, unordered_map, set, multiset, stack, queue, priority_queue (min/max heap), lower_bound, upper_bound, custom comparators."
                    },
                    {
                        "title": "3. Modern C++ & Competitive Optimization",
                        "syllabus_details": "Fast I/O, auto keyword, range-based loops, lambda expressions, smart pointers (unique_ptr, shared_ptr), time complexity optimization."
                    },
                    {
                        "title": "4. Top C++ Interview Questions & Answers",
                        "syllabus_details": (
                            "Q1: Virtual function vs Pure Virtual function? -> Virtual function provides a default implementation; pure virtual (= 0) makes a class abstract. | "
                            "Q2: std::map vs std::unordered_map? -> map uses Red-Black Tree with O(log n) lookup; unordered_map uses Hash Table with O(1) average lookup. | "
                            "Q3: What is RAII? -> Resource Acquisition Is Initialization ties resource lifecycle (memory/file locks) to object lifetime."
                        )
                    }
                ]
            },
            {
                "subject_code": "TRK-203",
                "category": "Logic Building • Java",
                "name": "Java Logic Building & Collections",
                "description": "Enterprise OOP design, JVM internals, exception handling, Java 8+ Streams, and Collections Framework.",
                "topics": [
                    {
                        "title": "1. JVM Internals & Core Logic",
                        "syllabus_details": "JDK vs JRE vs JVM, Stack vs Heap memory, Garbage Collection, String Pool & Immutability, StringBuilder, Wrapper classes & Autoboxing."
                    },
                    {
                        "title": "2. OOP Principles, Interfaces & Exceptions",
                        "syllabus_details": "Encapsulation, Inheritance, Polymorphism, Abstract Class vs Interface (default/static methods), Checked vs Unchecked Exceptions, try-with-resources."
                    },
                    {
                        "title": "3. Java Collections & Stream API Logic",
                        "syllabus_details": "ArrayList vs LinkedList, HashMap internal working (hashCode, equals, TreeNode buckets), HashSet, PriorityQueue, Lambda & Streams (filter, map, reduce)."
                    },
                    {
                        "title": "4. Top Java Interview Questions & Answers",
                        "syllabus_details": (
                            "Q1: Why are Strings immutable in Java? -> String Pool caching, security (network/DB URLs), thread safety, and cached hashCode. | "
                            "Q2: == vs .equals()? -> == compares object memory references; .equals() compares logical content. | "
                            "Q3: How does HashMap resolve collisions in Java 8+? -> Uses linked lists up to threshold 8, then converts the bucket into a balanced Red-Black Tree."
                        )
                    }
                ]
            },
            {
                "subject_code": "TRK-204",
                "category": "Logic Building • Python",
                "name": "Python Logic Building & Problem Solving",
                "description": "Clean algorithmic thinking, Pythonic data structures, comprehensions, generators, and backend scripting.",
                "topics": [
                    {
                        "title": "1. Pythonic Logic & Built-in Data Structures",
                        "syllabus_details": "List, Tuple, Set, Dict internals, List/Dict/Set Comprehensions, Slicing tricks, zip(), enumerate(), any(), all(), sorting with key=lambda."
                    },
                    {
                        "title": "2. Collections Module & Algorithmic Helpers",
                        "syllabus_details": "collections.Counter for frequency problems, defaultdict, deque (O(1) queue/stack), heapq (min-heap), itertools (permutations, combinations)."
                    },
                    {
                        "title": "3. Functions, Decorators, Generators & OOP",
                        "syllabus_details": "*args & **kwargs, Closures & Decorators, yield Generators for memory efficiency, Shallow vs Deep Copy, Magic/Dunder methods (__init__, __str__)."
                    },
                    {
                        "title": "4. Top Python Interview Questions & Answers",
                        "syllabus_details": (
                            "Q1: List vs Tuple? -> Lists are mutable dynamic arrays; Tuples are immutable, faster, and can be used as dictionary keys. | "
                            "Q2: What is the GIL? -> Global Interpreter Lock ensures only one thread executes Python bytecode at a time in CPython. | "
                            "Q3: Shallow copy vs Deep copy? -> Shallow copy copies outer references; Deep copy recursively clones all nested objects."
                        )
                    }
                ]
            }
        ]
        mongo_db.subjects.insert_many(subjects_data)

        assessments_data = [
            {
                "title": "Full-Stack & Core CS Technical Assessment",
                "subject_code": "TRK-101",
                "level": "SDE-1",
                "duration_minutes": 30,
                "total_marks": 30,
                "questions": [
                    {"q_id": 1, "question_text": "What is the worst-case time complexity of Binary Search on a sorted array of size n?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"], "correct_answer": "O(log n)"},
                    {"q_id": 2, "question_text": "Which data structure is optimal for implementing Breadth-First Search (BFS)?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["Stack", "Priority Queue", "Queue", "HashSet"], "correct_answer": "Queue"},
                    {"q_id": 3, "question_text": "Which database normal form eliminates transitive functional dependencies?", "question_type": "MCQ", "difficulty": "Medium", "marks": 5, "options": ["1NF", "2NF", "3NF", "BCNF"], "correct_answer": "3NF"},
                    {"q_id": 4, "question_text": "Which condition is NOT one of the four Coffman conditions required for a deadlock?", "question_type": "MCQ", "difficulty": "Hard", "marks": 5, "options": ["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"], "correct_answer": "Preemption"},
                    {"q_id": 5, "question_text": "Describe an optimal approach to detect a cycle in a singly linked list in O(1) auxiliary space.", "question_type": "DESCRIPTIVE", "difficulty": "Medium", "marks": 10}
                ]
            },
            {
                "title": "Backend, Database & System Design Screening",
                "subject_code": "TRK-103",
                "level": "SDE-1 & SDE-2",
                "duration_minutes": 25,
                "total_marks": 25,
                "questions": [
                    {"q_id": 1, "question_text": "Which HTTP status code indicates that a request was authenticated, but the user lacks permissions?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["401 Unauthorized", "403 Forbidden", "404 Not Found", "422 Unprocessable Entity"], "correct_answer": "403 Forbidden"},
                    {"q_id": 2, "question_text": "Which SQL clause is used to filter aggregated results after a GROUP BY operation?", "question_type": "MCQ", "difficulty": "Medium", "marks": 5, "options": ["WHERE", "HAVING", "ORDER BY", "LIMIT"], "correct_answer": "HAVING"},
                    {"q_id": 3, "question_text": "Which caching strategy writes data to both the cache and the backing database simultaneously?", "question_type": "MCQ", "difficulty": "Medium", "marks": 5, "options": ["Cache-Aside", "Write-Through", "Write-Behind", "Read-Through"], "correct_answer": "Write-Through"},
                    {"q_id": 4, "question_text": "How would you design rate limiting for a public REST API handling high concurrent traffic?", "question_type": "DESCRIPTIVE", "difficulty": "Hard", "marks": 10}
                ]
            },
            {
                "title": "Aptitude & Analytical Reasoning Test",
                "subject_code": "TRK-105",
                "level": "Standard Screening",
                "duration_minutes": 25,
                "total_marks": 25,
                "questions": [
                    {"q_id": 1, "question_text": "A train 150 m long passes a pole in 15 seconds. What is its speed in km/hr?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["30 km/hr", "36 km/hr", "40 km/hr", "45 km/hr"], "correct_answer": "36 km/hr"},
                    {"q_id": 2, "question_text": "If Engineer A completes a module in 10 days and Engineer B in 15 days, how many days will they take working together?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["5 days", "6 days", "8 days", "12 days"], "correct_answer": "6 days"},
                    {"q_id": 3, "question_text": "Identify the next term in the sequence: 2, 6, 12, 20, 30, ?", "question_type": "MCQ", "difficulty": "Medium", "marks": 5, "options": ["36", "40", "42", "44"], "correct_answer": "42"},
                    {"q_id": 4, "question_text": "A product is sold at $600 yielding a 20% profit. What was the base cost price?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["$480", "$500", "$520", "$550"], "correct_answer": "$500"},
                    {"q_id": 5, "question_text": "If all APIs are Services and some Services are Microservices, which conclusion definitely follows?", "question_type": "MCQ", "difficulty": "Medium", "marks": 5, "options": ["All APIs are Microservices", "Some APIs are Microservices", "All APIs are Services", "No API is a Microservice"], "correct_answer": "All APIs are Services"}
                ]
            },
            {
                "title": "Corporate Communication & Behavioral Readiness",
                "subject_code": "TRK-106",
                "level": "All Levels",
                "duration_minutes": 20,
                "total_marks": 25,
                "questions": [
                    {"q_id": 1, "question_text": "Which structure is most effective for answering 'Tell me about yourself' in technical and corporate interviews?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["Personal background -> Hobbies -> Family details", "Present (Role/Skills) -> Past (Projects/Impact) -> Future (Career Alignment)", "Compensation expectations -> Strengths -> Weaknesses", "Reciting every line of the resume chronologically"], "correct_answer": "Present (Role/Skills) -> Past (Projects/Impact) -> Future (Career Alignment)"},
                    {"q_id": 2, "question_text": "What is the recommended duration for an elevator pitch / self-introduction in an interview?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["15-20 seconds", "60-90 seconds", "4-5 minutes", "8-10 minutes"], "correct_answer": "60-90 seconds"},
                    {"q_id": 3, "question_text": "In behavioral interviews, what does the STAR framework stand for?", "question_type": "MCQ", "difficulty": "Easy", "marks": 5, "options": ["Situation, Task, Action, Result", "Skill, Target, Approach, Review", "Strategy, Team, Execution, Response", "Summary, Timeline, Analysis, Resolution"], "correct_answer": "Situation, Task, Action, Result"},
                    {"q_id": 4, "question_text": "Draft a crisp 60-second professional self-introduction tailored to your target software/IT role.", "question_type": "DESCRIPTIVE", "difficulty": "Easy", "marks": 10}
                ]
            },
            {
                "subject_code": "TRK-201",
                "title": "C Logic Building, Pointers & Interview Prep",
                "level": "Beginner to Intermediate",
                "duration_minutes": 20,
                "total_marks": 30,
                "questions": [
                    {"q_id": 101, "question_type": "MCQ", "question_text": "What is the output of sizeof('A') in standard C?", "options": ["1 byte", "2 bytes", "4 bytes", "8 bytes"], "correct_answer": "4 bytes", "marks": 5},
                    {"q_id": 102, "question_type": "MCQ", "question_text": "Which function initializes allocated heap memory to zero in C?", "options": ["malloc()", "calloc()", "realloc()", "alloc()"], "correct_answer": "calloc()", "marks": 5},
                    {"q_id": 103, "question_type": "MCQ", "question_text": "Which bitwise expression checks if an integer n is a power of 2 (for n > 0)?", "options": ["(n & (n - 1)) == 0", "(n | (n - 1)) == 0", "(n ^ (n + 1)) == 0", "(n & 1) == 0"], "correct_answer": "(n & (n - 1)) == 0", "marks": 5},
                    {"q_id": 104, "question_type": "MCQ", "question_text": "What is a pointer pointing to deallocated heap memory called?", "options": ["Null pointer", "Void pointer", "Dangling pointer", "Wild pointer"], "correct_answer": "Dangling pointer", "marks": 5},
                    {"q_id": 105, "question_type": "DESCRIPTIVE", "question_text": "Interview Question: Write the C logic to reverse an array in-place using two pointers and explain its time/space complexity.", "options": [], "correct_answer": "", "marks": 10}
                ]
            },
            {
                "subject_code": "TRK-202",
                "title": "C++ OOPs, STL & Interview Assessment",
                "level": "Intermediate",
                "duration_minutes": 20,
                "total_marks": 30,
                "questions": [
                    {"q_id": 201, "question_type": "MCQ", "question_text": "What is the average time complexity of lookup in C++ std::unordered_map?", "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"], "correct_answer": "O(1)", "marks": 5},
                    {"q_id": 202, "question_type": "MCQ", "question_text": "Which feature enables runtime polymorphism in C++?", "options": ["Function Overloading", "Templates", "Virtual Functions", "Inline Functions"], "correct_answer": "Virtual Functions", "marks": 5},
                    {"q_id": 203, "question_type": "MCQ", "question_text": "Which STL container keeps elements sorted in ascending order and allows only unique keys?", "options": ["std::vector", "std::set", "std::unordered_set", "std::deque"], "correct_answer": "std::set", "marks": 5},
                    {"q_id": 204, "question_type": "MCQ", "question_text": "Which smart pointer enforces exclusive ownership of a dynamically allocated object?", "options": ["std::shared_ptr", "std::weak_ptr", "std::unique_ptr", "std::auto_ptr"], "correct_answer": "std::unique_ptr", "marks": 5},
                    {"q_id": 205, "question_type": "DESCRIPTIVE", "question_text": "Interview Question: Explain the difference between a pointer and a reference variable in C++, and when to prefer references.", "options": [], "correct_answer": "", "marks": 10}
                ]
            },
            {
                "subject_code": "TRK-203",
                "title": "Java Logic, Collections & Interview Assessment",
                "level": "Intermediate",
                "duration_minutes": 20,
                "total_marks": 30,
                "questions": [
                    {"q_id": 301, "question_type": "MCQ", "question_text": "Which collection in Java does NOT allow duplicate keys and permits one null key?", "options": ["TreeMap", "HashMap", "Hashtable", "ArrayList"], "correct_answer": "HashMap", "marks": 5},
                    {"q_id": 302, "question_type": "MCQ", "question_text": "Which keyword prevents a method from being overridden in a subclass?", "options": ["static", "abstract", "final", "volatile"], "correct_answer": "final", "marks": 5},
                    {"q_id": 303, "question_type": "MCQ", "question_text": "Where are String literals stored in Java memory?", "options": ["Stack Memory", "String Constant Pool (Heap)", "Native Method Stack", "PC Register"], "correct_answer": "String Constant Pool (Heap)", "marks": 5},
                    {"q_id": 304, "question_type": "MCQ", "question_text": "Which Java 8+ functional interface takes one input argument and returns a boolean?", "options": ["Function", "Consumer", "Supplier", "Predicate"], "correct_answer": "Predicate", "marks": 5},
                    {"q_id": 305, "question_type": "DESCRIPTIVE", "question_text": "Interview Question: Explain how HashMap handles hash collisions internally in Java 8+ and why equals() and hashCode() must be overridden together.", "options": [], "correct_answer": "", "marks": 10}
                ]
            },
            {
                "subject_code": "TRK-204",
                "title": "Python Logic Building & Interview Assessment",
                "level": "Beginner to Intermediate",
                "duration_minutes": 20,
                "total_marks": 30,
                "questions": [
                    {"q_id": 401, "question_type": "MCQ", "question_text": "What is the output of [x*2 for x in range(3)] in Python?", "options": ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]", "(0, 2, 4)"], "correct_answer": "[0, 2, 4]", "marks": 5},
                    {"q_id": 402, "question_type": "MCQ", "question_text": "Which data type in Python is immutable and can be used as a dictionary key?", "options": ["List", "Dictionary", "Set", "Tuple"], "correct_answer": "Tuple", "marks": 5},
                    {"q_id": 403, "question_type": "MCQ", "question_text": "Which keyword turns a Python function into a lazy iterator/generator?", "options": ["return", "yield", "async", "pass"], "correct_answer": "yield", "marks": 5},
                    {"q_id": 404, "question_type": "MCQ", "question_text": "Which built-in module provides O(1) append/pop from both ends of a queue?", "options": ["collections.deque", "heapq", "bisect", "array"], "correct_answer": "collections.deque", "marks": 5},
                    {"q_id": 405, "question_type": "DESCRIPTIVE", "question_text": "Interview Question: Write Python logic to find the first non-repeating character in a string in O(n) time and explain the GIL.", "options": [], "correct_answer": "", "marks": 10}
                ]
            }
        ]
        mongo_db.assessments.insert_many(assessments_data)

        plans_data = [
            {"candidate_id": "CAND_001", "skill_name": "Data Structures & Algorithms", "action_text": "Solve medium-level array, tree, and graph problems to boost coding round speed.", "priority": "High Priority"},
            {"candidate_id": "CAND_001", "skill_name": "Logic Building (C / C++ / Java / Python)", "action_text": "Master pointers, STL, Java Collections, and Pythonic problem-solving patterns.", "priority": "High Priority"},
            {"candidate_id": "CAND_001", "skill_name": "System Design & Cloud", "action_text": "Practice scalable API architecture, caching strategies, and database indexing.", "priority": "High Priority"},
            {"candidate_id": "CAND_001", "skill_name": "Executive Communication", "action_text": "Refine your 60-second pitch and structure project impact using the STAR framework.", "priority": "Medium Priority"}
        ]
        mongo_db.improvement_plans.insert_many(plans_data)

        drives_data = [
            {"company_name": "TechNova Systems", "role_title": "Software Development Engineer (SDE-1)", "package_lpa": "8.5 LPA", "min_cgpa": 7.0, "required_skills": "DSA, C++/Java/Python, SQL, REST APIs", "drive_date": "2026-12-10", "status": "Open"},
            {"company_name": "CloudScale Solutions", "role_title": "Backend & Cloud Engineer", "package_lpa": "12.0 LPA", "min_cgpa": 6.5, "required_skills": "System Design, Python/Node.js, MongoDB, Docker", "drive_date": "2026-12-18", "status": "Upcoming"},
            {"company_name": "FinEdge Analytics", "role_title": "Full-Stack Product Developer", "package_lpa": "9.0 LPA", "min_cgpa": 6.5, "required_skills": "React, FastAPI/Express, SQL, Problem Solving", "drive_date": "2026-12-22", "status": "Open"}
        ]
        mongo_db.placement_drives.insert_many(drives_data)

        return {"success": True, "message": "Database seeded successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}. Ensure MongoDB service is running.")

@app.get("/api/subjects")
def get_subjects(category: Optional[str] = Query(None)):
    try:
        query = {"category": category} if category else {}
        return [serialize_doc(doc) for doc in mongo_db.subjects.find(query)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}")

@app.get("/api/assessments")
def get_assessments():
    try:
        return [serialize_doc(doc) for doc in mongo_db.assessments.find()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}")

@app.get("/api/assessments/{assessment_id}")
def get_assessment_by_id(assessment_id: str):
    doc = mongo_db.assessments.find_one({"_id": ObjectId(assessment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return serialize_doc(doc)

@app.post("/api/assessments/submit")
def submit_assessment(req: SubmitAssessmentRequest):
    assessment = mongo_db.assessments.find_one({"_id": ObjectId(req.assessment_id)})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    score = 0
    for q in assessment["questions"]:
        q_key = str(q["q_id"])
        if q["question_type"] == "MCQ" and req.answers.get(q_key) == q.get("correct_answer"):
            score += q["marks"]
    attempt_doc = {
        "candidate_id": req.candidate_id,
        "assessment_id": req.assessment_id,
        "title": assessment["title"],
        "score": score,
        "total_marks": assessment["total_marks"],
        "answers": req.answers
    }
    mongo_db.attempts.insert_one(attempt_doc)
    return {"success": True, "score": score, "total_marks": assessment["total_marks"]}

@app.get("/api/improvement-plan")
def get_improvement_plan(candidate_id: str = "CAND_001"):
    return [serialize_doc(doc) for doc in mongo_db.improvement_plans.find({"candidate_id": candidate_id})]

@app.get("/api/drives")
def get_drives():
    return [serialize_doc(doc) for doc in mongo_db.placement_drives.find()]

@app.post("/api/drives")
def create_drive(req: CreateDriveRequest):
    try:
        drive_doc = {
            "company_name": req.company_name,
            "role_title": req.role_title,
            "package_lpa": req.package_lpa,
            "min_cgpa": req.min_cgpa,
            "required_skills": req.required_skills,
            "drive_date": req.drive_date,
            "status": req.status
        }
        result = mongo_db.placement_drives.insert_one(drive_doc)
        return {"success": True, "id": str(result.inserted_id), "message": "Hiring drive added!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}")

@app.post("/api/applications")
def apply_job(req: ApplyRequest):
    drive = mongo_db.placement_drives.find_one({"_id": ObjectId(req.job_id)})
    if not drive:
        raise HTTPException(status_code=404, detail="Job opportunity not found")
    app_doc = {
        "candidate_id": req.candidate_id,
        "candidate_name": req.candidate_name,
        "job_id": req.job_id,
        "company_name": drive["company_name"],
        "role_title": drive["role_title"],
        "package_lpa": drive["package_lpa"],
        "application_status": "Applied"
    }
    mongo_db.applications.insert_one(app_doc)
    return {"success": True, "message": "Application submitted successfully"}

@app.get("/api/applications")
def get_applications(candidate_id: str = "CAND_001"):
    return [serialize_doc(doc) for doc in mongo_db.applications.find({"candidate_id": candidate_id})]