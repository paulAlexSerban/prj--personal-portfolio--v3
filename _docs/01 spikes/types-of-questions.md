# Types of questions
- there are multiple types of questions that can be implemented with an Spaced Repetition System (SRS)

## By answer format:
- multiple choice - one correct anser from several options
- multiple select - several correct answers from several options
- true/false - a statement that is either true or false - binary choice
## By question style:
- factual recall - testing memory of specific facts or information
- comprehension - testing understanding of concepts or relationships
- application - applying knwoledge of a concept to a new situation or problem
- scenario/case study - presenting a real-world scenario and asking questions about it
- open-ended - allowing for free-form responses that require critical thinking and synthesis of information
- analogy - comparing a new concept to a familiar one to aid understanding and retention

## Each of these should have a data model in json

- multiple choice:
```json
{
  "type": "multiple_choice",
  "question": "What is the capital of France?",
  "options": [
    "Berlin",
    "Madrid",
    "Paris",
    "Rome"
  ],
  "answer": "Paris",
  "explanation": "Paris is the capital of France."
}
```

- multiple select:
```json
{
  "type": "multiple_select",
  "question": "Which of the following are prime numbers?",
  "options": [
    "2",
    "3",
    "4",
    "5"
  ],
  "answers": ["2", "3", "5"],
  "explanation": "2, 3, and 5 are prime numbers. 4 is not because it is divisible by 2."
}
```

- true/false:
```json
{
  "type": "true_false",
  "question": "The Earth is flat.",
  "answer": false,
  "explanation": "The Earth is an oblate spheroid, not flat."
}
```

- factual recall:
```json
{
  "type": "factual_recall",
  "question": "Who was the first president of the United States?",
  "answer": "George Washington",
  "explanation": "George Washington served as the first president from 1789 to 1797."
}
```

- comprehension:
```json
{
  "type": "comprehension",
  "question": "Explain the concept of photosynthesis.",
  "answer": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll. It involves the conversion of carbon dioxide and water into glucose and oxygen.",
  "explanation": "Photosynthesis is essential for life on Earth as it provides oxygen and food for many organisms."
}
```

- application:
```json
{
  "type": "application",
  "question": "How would you apply the concept of supply and demand to explain the price of a product?",
  "answer": "The price of a product is determined by the balance between supply and demand. If demand for a product increases while supply remains constant, the price tends to rise. Conversely, if supply increases while demand remains constant, the price tends to fall.",
  "explanation": "Understanding supply and demand helps explain market dynamics and pricing."
}
```

- scenario/case study:
```json
{
  "type": "scenario",
  "question": "A company is experiencing a decline in sales. What strategies could they implement to improve their performance?",
  "answer": "The company could conduct market research to identify customer needs, improve product quality, enhance marketing efforts, or diversify their product line.",
  "explanation": "Analyzing the situation and implementing strategic changes can help the company recover and grow."
}
```

- open-ended:
```json
{
  "type": "open_ended",
  "question": "What are the potential benefits and drawbacks of remote work?",
  "answer": "Benefits of remote work include increased flexibility, reduced commuting time, and improved work-life balance. Drawbacks may include feelings of isolation, difficulty in collaboration, and challenges in maintaining productivity.",
  "explanation": "Remote work has both advantages and disadvantages that can impact employees and organizations differently."
}
```

- analogy:
```json
{
  "type": "analogy",
  "question": "How is the structure of an atom similar to a solar system?",
  "answer": "In an atom, electrons orbit the nucleus similar to how planets orbit the sun in a solar system. The nucleus is like the sun, providing a central point of attraction, while the electrons are like planets, moving around it.",
  "explanation": "This analogy helps to visualize the atomic structure and understand the relationship between its components."
}
```